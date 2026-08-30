import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { assetLibraryItems, users } from "../drizzle/schema";
import { metadataForExistingAsset } from "../server/assetLibraryMetadata";
import { getDb } from "../server/db";
import { storagePut } from "../server/storage";

const ROOT = "/home/ubuntu";
const ASSET_ROOTS = [
  "depaula_teixeira_instagram_artes_com_logo",
  "depaula_teixeira_instagram_novos_temas",
  "depaula_teixeira_carrosseis",
  "depaula_teixeira_carrosseis_empresariais",
].map((folder) => path.join(ROOT, folder));

async function walk(folder: string): Promise<string[]> {
  const entries = await readdir(folder, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(folder, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return entry.isFile() && /\.png$/i.test(entry.name) ? [fullPath] : [];
  }));
  return nested.flat();
}

function pngDimensions(bytes: Buffer) {
  if (bytes.length < 24 || bytes.toString("ascii", 1, 4) !== "PNG") throw new Error("Somente PNGs válidos podem ser importados na biblioteca inicial.");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

async function main() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const ownerOpenId = process.env.OWNER_OPEN_ID;
  if (!ownerOpenId) throw new Error("Identidade proprietária indisponível para importação.");
  const [owner] = await db.select({ id: users.id }).from(users).where(eq(users.openId, ownerOpenId)).limit(1);
  if (!owner) throw new Error("Usuário proprietário não encontrado. Faça login no Social Studio antes de importar as artes.");
  const existing = await db.select({ sourcePath: assetLibraryItems.sourcePath }).from(assetLibraryItems).where(eq(assetLibraryItems.userId, owner.id));
  const seen = new Set(existing.map((item) => item.sourcePath));
  const filePaths = (await Promise.all(ASSET_ROOTS.map(walk))).flat().sort();
  let imported = 0;
  for (const filePath of filePaths) {
    const sourcePath = path.relative(ROOT, filePath).replace(/\\/g, "/");
    if (seen.has(sourcePath)) continue;
    const metadata = metadataForExistingAsset(sourcePath);
    const bytes = await readFile(filePath);
    const size = await stat(filePath);
    const dimensions = pngDimensions(bytes);
    const storageKey = `social-studio/${owner.id}/asset-library/${sourcePath.replace(/[^a-zA-Z0-9._/-]+/g, "-")}`;
    const stored = await storagePut(storageKey, bytes, "image/png");
    await db.insert(assetLibraryItems).values({
      userId: owner.id,
      sourcePath,
      storageKey: stored.key,
      url: stored.url,
      fileName: path.basename(filePath),
      area: metadata.area,
      title: metadata.title,
      assetType: metadata.assetType,
      groupKey: metadata.groupKey,
      slideOrder: metadata.slideOrder,
      mimeType: "image/png",
      byteSize: size.size,
      width: dimensions.width,
      height: dimensions.height,
      tags: metadata.tags,
    });
    imported += 1;
    console.log(`Importada ${imported}/${filePaths.length}: ${sourcePath}`);
  }
  console.log(JSON.stringify({ discovered: filePaths.length, imported, skipped: filePaths.length - imported }));
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  },
);
