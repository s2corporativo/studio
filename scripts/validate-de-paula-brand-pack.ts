import { access, readFile } from "node:fs/promises";
import path from "node:path";

const packRoot = path.resolve(process.cwd(), "brand-packs/s2-studio");
const expected = (await readFile(path.join(packRoot, "assets.expected.txt"), "utf8"))
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(Boolean);
const memory = JSON.parse(await readFile(path.join(packRoot, "brand-memory.json"), "utf8")) as {
  schemaVersion?: number;
  packageAudit?: { expectedVisualAssets?: number };
};

if (memory.schemaVersion !== 1) throw new Error("Brand Memory com schemaVersion inválida.");
if (expected.length !== 108 || memory.packageAudit?.expectedVisualAssets !== 108) {
  throw new Error("Inventário canônico deve conter exatamente 108 ativos visuais.");
}

const sourceRoot = process.env.DE_PAULA_ASSET_ROOT ?? "/home/ubuntu";
const missing: string[] = [];
for (const relativePath of expected) {
  try {
    await access(path.join(sourceRoot, relativePath));
  } catch {
    missing.push(relativePath);
  }
}

const result = {
  brandPack: "de-paula-teixeira",
  expected: expected.length,
  sourceRoot,
  availableOnHost: expected.length - missing.length,
  missingOnHost: missing.length,
  missing,
  strict: process.argv.includes("--strict"),
};
console.log(JSON.stringify(result, null, 2));
if (result.strict && missing.length > 0) process.exitCode = 1;
