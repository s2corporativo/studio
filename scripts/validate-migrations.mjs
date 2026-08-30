import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const drizzleDir = path.join(root, "drizzle");
const journalPath = path.join(drizzleDir, "meta", "_journal.json");

function fail(message) {
  console.error(`Migration validation failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(journalPath)) fail("drizzle/meta/_journal.json is missing");
const journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));
if (!Array.isArray(journal.entries)) fail("journal.entries is not an array");

const seenIdx = new Set();
const seenTags = new Set();
for (const entry of journal.entries) {
  if (seenIdx.has(entry.idx)) fail(`duplicate journal idx ${entry.idx}`);
  if (seenTags.has(entry.tag)) fail(`duplicate journal tag ${entry.tag}`);
  seenIdx.add(entry.idx);
  seenTags.add(entry.tag);
  const sqlPath = path.join(drizzleDir, `${entry.tag}.sql`);
  if (!fs.existsSync(sqlPath)) fail(`journal references missing file ${entry.tag}.sql`);
  const migrationSql = fs.readFileSync(sqlPath, "utf8").trim();
  if (!migrationSql) fail(`${entry.tag}.sql is empty`);
}

const ordered = [...journal.entries].sort((a, b) => a.idx - b.idx);
for (let i = 0; i < ordered.length; i++) {
  if (ordered[i].idx !== i) fail(`journal idx sequence breaks at ${i}`);
}

const migrationFiles = fs.readdirSync(drizzleDir)
  .filter(name => /^\d{4}_.+\.sql$/.test(name))
  .map(name => name.replace(/\.sql$/, ""));
const orphanFiles = migrationFiles.filter(tag => !seenTags.has(tag));
if (orphanFiles.length) fail(`orphan migration file(s) outside journal: ${orphanFiles.join(", ")}`);

const missingPhysical = [...seenTags].filter(tag => !migrationFiles.includes(tag));
if (missingPhysical.length) fail(`journal migration(s) missing from directory: ${missingPhysical.join(", ")}`);

console.log(`Migration journal OK: ${journal.entries.length} migration(s) validated; no orphan SQL files.`);
