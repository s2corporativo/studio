import "dotenv/config";
import { spawnSync } from "node:child_process";
import mysql, { type Connection, type RowDataPacket } from "mysql2/promise";

const apply = process.argv.includes("--apply");
const databaseUrl = process.env.DATABASE_URL ?? "";

if (!databaseUrl) {
  console.error("[deploy] DATABASE_URL não configurada.");
  process.exit(1);
}

const requiredTables = [
  "brand_profiles",
  "automation_settings",
  "social_profiles",
  "content_opportunities",
  "post_versions",
  "post_approval_bindings",
  "campaign_runs",
  "social_interactions",
  "leads",
  "competitors",
  "content_metrics",
  "creative_evaluations",
  "automation_rules",
  "audit_events",
  "video_projects",
  "seo_audits",
  "ad_plans",
  "performance_insights",
  "brand_memory_items",
  "agent_runs",
  "compliance_checks",
  "generated_reports",
] as const;

const requiredAutomationColumns = [
  "id", "userId", "enabled", "cadence", "postsPerWeek", "defaultPublishTime",
  "planningHorizonDays", "requireApproval", "refreshRadarDaily", "preferredAreas",
  "preferredFormats", "createdAt", "updatedAt",
];

async function tableExists(connection: Connection, tableName: string) {
  const [rows] = await connection.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
    [tableName],
  );
  return Number(rows[0]?.total ?? 0) > 0;
}

async function indexExists(connection: Connection, tableName: string, indexName: string) {
  const [rows] = await connection.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS total FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?",
    [tableName, indexName],
  );
  return Number(rows[0]?.total ?? 0) > 0;
}

async function getColumns(connection: Connection, tableName: string) {
  const [rows] = await connection.query<RowDataPacket[]>(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?",
    [tableName],
  );
  return new Set(rows.map(row => String(row.column_name)));
}

async function verifyFinalState(connection: Connection) {
  const missingTables: string[] = [];
  for (const table of requiredTables) if (!(await tableExists(connection, table))) missingTables.push(table);
  if (missingTables.length) throw new Error(`Migration incompleta. Tabelas ausentes: ${missingTables.join(", ")}.`);

  if (!(await indexExists(connection, "brand_profiles", "brand_profiles_user_unique"))) {
    throw new Error("Índice brand_profiles_user_unique não foi encontrado após a migration.");
  }

  const automationColumns = await getColumns(connection, "automation_settings");
  const missingAutomationColumns = requiredAutomationColumns.filter(column => !automationColumns.has(column));
  if (missingAutomationColumns.length) {
    throw new Error(`automation_settings incompatível. Colunas ausentes: ${missingAutomationColumns.join(", ")}.`);
  }

  const socialProfileColumns = await getColumns(connection, "instagram_connections");
  if (!socialProfileColumns.has("socialProfileId")) throw new Error("instagram_connections.socialProfileId não foi aplicado.");
}

async function main() {
  const connection = await mysql.createConnection(databaseUrl);
  try {
    console.log(`[deploy] modo: ${apply ? "APPLY" : "CHECK"}`);

    if (!(await tableExists(connection, "brand_profiles"))) {
      throw new Error("Tabela brand_profiles não existe. O schema base não está pronto; nenhuma alteração foi feita.");
    }

    const [duplicates] = await connection.query<RowDataPacket[]>(
      "SELECT userId, COUNT(*) AS total FROM brand_profiles GROUP BY userId HAVING COUNT(*) > 1 LIMIT 20",
    );
    if (duplicates.length > 0) {
      console.error("[deploy] bloqueado: existem userId duplicados em brand_profiles.");
      for (const row of duplicates) console.error(`  userId=${row.userId} registros=${row.total}`);
      throw new Error("Resolva as duplicidades de brand_profiles antes da restrição UNIQUE.");
    }

    const current = await Promise.all(requiredTables.map(async table => [table, await tableExists(connection, table)] as const));
    const missingBefore = current.filter(([, exists]) => !exists).map(([table]) => table);
    console.log(`[deploy] tabelas pendentes: ${missingBefore.length ? missingBefore.join(", ") : "nenhuma"}`);

    if (!apply) {
      console.log(`[deploy] preflight seguro. needsMigration=${missingBefore.length > 0}`);
      return;
    }
  } finally {
    await connection.end();
  }

  console.log("[deploy] aplicando histórico oficial do Drizzle...");
  const migration = spawnSync("pnpm", ["exec", "drizzle-kit", "migrate"], {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (migration.error) throw migration.error;
  if (migration.status !== 0) throw new Error(`drizzle-kit migrate encerrou com código ${migration.status ?? "desconhecido"}.`);

  const verificationConnection = await mysql.createConnection(databaseUrl);
  try {
    await verifyFinalState(verificationConnection);
    console.log("[deploy] histórico Drizzle aplicado e estrutura Social OS verificada sem reset ou exclusão de dados.");
  } finally {
    await verificationConnection.end();
  }
}

main().then(
  () => process.exit(0),
  error => {
    console.error(`[deploy] FALHA: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  },
);
