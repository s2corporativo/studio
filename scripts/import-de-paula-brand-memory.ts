import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { brandProfiles, knowledgeMaterials, users } from "../drizzle/schema";
import { getDb } from "../server/db";
import { ensureStudioDefaults } from "../server/socialStudioDb";
import { storagePut } from "../server/storage";

type BrandMemory = {
  schemaVersion: number;
  brandName: string;
  positioning: {
    audienceMix: Array<{ segment: string; weight: number; focus: string[] }>;
    tone: string[];
    avoidClaims: string[];
  };
  visualSystem: {
    palette: string[];
    typography: string[];
    families: Array<{ key: string; purpose: string }>;
    repetitionControl: { rule: string; target: string };
  };
};

const APPLY = process.argv.includes("--apply");
const packRoot = path.resolve(process.cwd(), "brand-packs/de-paula-teixeira");
const memory = JSON.parse(await readFile(path.join(packRoot, "brand-memory.json"), "utf8")) as BrandMemory;
if (memory.schemaVersion !== 1) throw new Error("Versão da Brand Memory não suportada.");

const ownerOpenId = process.env.OWNER_OPEN_ID;
if (!ownerOpenId) throw new Error("OWNER_OPEN_ID é obrigatório para identificar o proprietário do Brand Pack.");
const db = await getDb();
if (!db) throw new Error("Banco de dados indisponível.");
const [owner] = await db.select({ id: users.id }).from(users).where(eq(users.openId, ownerOpenId)).limit(1);
if (!owner) throw new Error("Usuário proprietário não encontrado. Faça login no Studio antes da importação.");

const visualGuidelines = [
  `Paleta: ${memory.visualSystem.palette.join(", ")}.`,
  `Tipografia: ${memory.visualSystem.typography.join("; ")}.`,
  `Famílias: ${memory.visualSystem.families.map(item => `${item.key} (${item.purpose})`).join("; ")}.`,
  memory.visualSystem.repetitionControl.rule,
  memory.visualSystem.repetitionControl.target,
].join(" ");
const targetAudience = memory.positioning.audienceMix
  .map(item => `${item.segment} ${item.weight}% — ${item.focus.join(", ")}`)
  .join(" | ");
const toneOfVoice = `${memory.positioning.tone.join(", ")}. Evitar: ${memory.positioning.avoidClaims.join(", ")}.`;

const knowledgeFiles = [
  ["Posicionamento editorial — Brand Pack", "positioning.md"],
  ["Estratégia editorial — Brand Pack", "editorial-strategy.md"],
  ["Sistema visual — Brand Pack", "visual-system.md"],
  ["Compliance de conteúdo — Brand Pack", "compliance.md"],
  ["Catálogo editorial — Brand Pack", "content-catalog.md"],
] as const;

if (!APPLY) {
  console.log(JSON.stringify({
    mode: "dry-run",
    ownerId: owner.id,
    brandName: memory.brandName,
    knowledgeFiles: knowledgeFiles.map(([, file]) => file),
    databaseWrites: false,
    storageWrites: false,
    publicationTriggered: false,
    message: "Use --apply para persistir. O dry-run não altera banco, storage ou publicação social.",
  }, null, 2));
  process.exit(0);
}

await ensureStudioDefaults(owner.id);
await db.update(brandProfiles).set({
  targetAudience,
  toneOfVoice,
  visualGuidelines,
  updatedAt: new Date(),
}).where(eq(brandProfiles.userId, owner.id));

let imported = 0;
let skipped = 0;
for (const [title, fileName] of knowledgeFiles) {
  const content = await readFile(path.join(packRoot, "knowledge", fileName), "utf8");
  const digest = createHash("sha256").update(content).digest("hex");
  const [existing] = await db.select({ id: knowledgeMaterials.id, notes: knowledgeMaterials.notes })
    .from(knowledgeMaterials)
    .where(and(eq(knowledgeMaterials.userId, owner.id), eq(knowledgeMaterials.title, title)))
    .limit(1);
  if (existing?.notes?.includes(`sha256:${digest}`)) {
    skipped += 1;
    continue;
  }
  const storageKey = `social-studio/${owner.id}/conhecimento/brand-pack/de-paula-teixeira/${fileName}`;
  const stored = await storagePut(storageKey, content, "text/markdown; charset=utf-8");
  const values = {
    materialType: "brand_pack",
    url: stored.url,
    storageKey: stored.key,
    mimeType: "text/markdown",
    notes: `Brand Pack versionado. sha256:${digest}`,
    isVerified: true,
  };
  if (existing) {
    await db.update(knowledgeMaterials).set(values).where(eq(knowledgeMaterials.id, existing.id));
  } else {
    await db.insert(knowledgeMaterials).values({ userId: owner.id, title, ...values });
  }
  imported += 1;
}

console.log(JSON.stringify({ mode: "applied", ownerId: owner.id, imported, skipped, publicationTriggered: false }, null, 2));
