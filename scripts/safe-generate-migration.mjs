import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const metaDir = path.join(root, "drizzle", "meta");
const journalPath = path.join(metaDir, "_journal.json");
if (!fs.existsSync(journalPath)) {
  console.error("[db:generate] bloqueado: journal de migrations ausente.");
  process.exit(1);
}

const journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));
const highestJournalIdx = Math.max(-1, ...journal.entries.map(entry => Number(entry.idx)));
const snapshotIndexes = fs.readdirSync(metaDir)
  .map(name => name.match(/^(\d{4})_snapshot\.json$/)?.[1])
  .filter(Boolean)
  .map(Number);
const highestSnapshotIdx = Math.max(-1, ...snapshotIndexes);

if (highestSnapshotIdx !== highestJournalIdx) {
  console.error(`[db:generate] BLOQUEADO: snapshots Drizzle vão até ${String(highestSnapshotIdx).padStart(4, "0")}, mas o journal vai até ${String(highestJournalIdx).padStart(4, "0")}.`);
  console.error("As migrations atuais após o último snapshot são SQL explícitas/reconciliadas. Rodar drizzle-kit generate agora pode recriar estruturas já aplicadas.");
  console.error("Regere um baseline de snapshots em ambiente controlado antes de habilitar geração automática. Use pnpm db:migrate para aplicar migrations já registradas.");
  process.exit(1);
}

const result = spawnSync("pnpm", ["exec", "drizzle-kit", "generate"], { stdio: "inherit", shell: process.platform === "win32" });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
