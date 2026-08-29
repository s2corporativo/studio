import { z } from "zod";
import { badRequest } from "../_core/publicErrors";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { createKnowledgeMaterial } from "../socialStudioDb";
import { recordAuditEvent } from "../socialOsDb";

function zipEntries(bytes: Buffer) {
  const minEocdSize = 22;
  if (bytes.length < minEocdSize) return null;
  let eocdOffset = -1;
  const searchStart = Math.max(0, bytes.length - 65_557);
  for (let offset = bytes.length - minEocdSize; offset >= searchStart; offset -= 1) {
    if (bytes.readUInt32LE(offset) === 0x06054b50) { eocdOffset = offset; break; }
  }
  if (eocdOffset < 0 || eocdOffset + minEocdSize > bytes.length) return null;
  const totalEntries = bytes.readUInt16LE(eocdOffset + 10);
  const centralDirectorySize = bytes.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = bytes.readUInt32LE(eocdOffset + 16);
  if (centralDirectoryOffset + centralDirectorySize > bytes.length) return null;

  const names: string[] = [];
  let offset = centralDirectoryOffset;
  for (let index = 0; index < totalEntries; index += 1) {
    if (offset + 46 > bytes.length || bytes.readUInt32LE(offset) !== 0x02014b50) return null;
    const fileNameLength = bytes.readUInt16LE(offset + 28);
    const extraLength = bytes.readUInt16LE(offset + 30);
    const commentLength = bytes.readUInt16LE(offset + 32);
    const nameStart = offset + 46;
    const nameEnd = nameStart + fileNameLength;
    if (nameEnd > bytes.length) return null;
    names.push(bytes.subarray(nameStart, nameEnd).toString("utf8").replace(/\\/g, "/"));
    offset = nameEnd + extraLength + commentLength;
  }
  return names;
}

export function detectKnowledgeFile(bytes: Buffer) {
  const starts = (...values: number[]) => values.every((value, index) => bytes[index] === value);
  if (bytes.subarray(0, 5).toString("ascii") === "%PDF-") return { mimeType: "application/pdf", extension: ".pdf", claims: ["pdf"] };
  if (starts(0xff, 0xd8, 0xff)) return { mimeType: "image/jpeg", extension: ".jpg", claims: ["jpeg", "jpg"] };
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { mimeType: "image/png", extension: ".png", claims: ["png"] };
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return { mimeType: "image/webp", extension: ".webp", claims: ["webp"] };
  if (starts(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1)) return { mimeType: "application/msword", extension: ".doc", claims: ["msword", "doc"] };
  if (starts(0x50, 0x4b, 0x03, 0x04)) {
    const entries = zipEntries(bytes);
    if (!entries) return null;
    const entrySet = new Set(entries);
    const hasContentTypes = entrySet.has("[Content_Types].xml");
    const hasWordDocument = entrySet.has("word/document.xml");
    const hasRelationships = entrySet.has("_rels/.rels") && entrySet.has("word/_rels/document.xml.rels");
    if (hasContentTypes && hasWordDocument && hasRelationships) return { mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", extension: ".docx", claims: ["wordprocessingml", "docx"] };
    return null;
  }
  return null;
}

export const knowledgeSecurityRouter = router({
  upload: protectedProcedure.input(z.object({
    title: z.string().min(3).max(255),
    materialType: z.string().min(2).max(60),
    mimeType: z.string().min(3).max(120),
    base64: z.string().min(8).max(8_000_000),
    notes: z.string().nullable(),
    isVerified: z.boolean(),
  })).mutation(async ({ ctx, input }) => {
    const bytes = Buffer.from(input.base64, "base64");
    if (bytes.byteLength === 0 || bytes.byteLength > 5 * 1024 * 1024) badRequest("O arquivo deve ter até 5 MB.");
    const detected = detectKnowledgeFile(bytes);
    if (!detected) badRequest("Formato inválido ou conteúdo incompatível. Um ZIP genérico não é aceito como DOCX.");
    const claim = input.mimeType.toLocaleLowerCase("pt-BR");
    if (!detected.claims.some(value => claim.includes(value))) badRequest("O tipo informado pelo navegador não corresponde ao conteúdo real do arquivo.");
    const safeName = input.title.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "material";
    const stored = await storagePut(`social-studio/${ctx.user.id}/conhecimento/${safeName}-${Date.now()}${detected.extension}`, bytes, detected.mimeType);
    const material = await createKnowledgeMaterial(ctx.user.id, { title: input.title, materialType: input.materialType, url: stored.url, storageKey: stored.key, mimeType: detected.mimeType, notes: input.notes, isVerified: input.isVerified });
    await recordAuditEvent(ctx.user.id, "knowledge.secure_upload", "knowledge_material", material?.id, { mimeType: detected.mimeType, byteSize: bytes.byteLength });
    return material;
  }),
});
