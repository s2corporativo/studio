import "dotenv/config";
import mysql, { type RowDataPacket } from "mysql2/promise";

const apply = process.argv.includes("--apply");
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("[deploy] DATABASE_URL não configurada.");
  process.exit(1);
}

const requiredAutomationColumns = [
  "id",
  "userId",
  "enabled",
  "cadence",
  "postsPerWeek",
  "defaultPublishTime",
  "planningHorizonDays",
  "requireApproval",
  "refreshRadarDaily",
  "preferredAreas",
  "preferredFormats",
  "createdAt",
  "updatedAt",
];

async function tableExists(connection: mysql.Connection, tableName: string) {
  const [rows] = await connection.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
    [tableName],
  );
  return Number(rows[0]?.total ?? 0) > 0;
}

async function indexExists(connection: mysql.Connection, tableName: string, indexName: string) {
  const [rows] = await connection.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS total FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?",
    [tableName, indexName],
  );
  return Number(rows[0]?.total ?? 0) > 0;
}

async function getColumns(connection: mysql.Connection, tableName: string) {
  const [rows] = await connection.query<RowDataPacket[]>(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?",
    [tableName],
  );
  return new Set(rows.map(row => String(row.column_name)));
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
      throw new Error("Resolva as duplicidades de brand_profiles antes de aplicar a restrição UNIQUE.");
    }

    const hasBrandUnique = await indexExists(connection, "brand_profiles", "brand_profiles_user_unique");
    const hasAutomationTable = await tableExists(connection, "automation_settings");

    if (hasAutomationTable) {
      const columns = await getColumns(connection, "automation_settings");
      const missing = requiredAutomationColumns.filter(column => !columns.has(column));
      if (missing.length > 0) {
        throw new Error(`automation_settings já existe, mas está incompatível. Colunas ausentes: ${missing.join(", ")}. Nenhuma alteração automática foi feita.`);
      }
    }

    console.log(`[deploy] brand_profiles UNIQUE: ${hasBrandUnique ? "presente" : "pendente"}`);
    console.log(`[deploy] automation_settings: ${hasAutomationTable ? "presente" : "pendente"}`);

    if (!apply) {
      console.log(`[deploy] preflight seguro. needsMigration=${!hasBrandUnique || !hasAutomationTable}`);
      return;
    }

    if (!hasBrandUnique) {
      console.log("[deploy] adicionando índice único brand_profiles_user_unique...");
      await connection.query("ALTER TABLE brand_profiles ADD CONSTRAINT brand_profiles_user_unique UNIQUE (userId)");
    }

    if (!hasAutomationTable) {
      console.log("[deploy] criando automation_settings...");
      await connection.query(`
        CREATE TABLE automation_settings (
          id int AUTO_INCREMENT NOT NULL,
          userId int NOT NULL,
          enabled boolean NOT NULL DEFAULT false,
          cadence enum('daily','weekdays','custom') NOT NULL DEFAULT 'weekdays',
          postsPerWeek int NOT NULL DEFAULT 5,
          defaultPublishTime varchar(5) NOT NULL DEFAULT '18:30',
          planningHorizonDays int NOT NULL DEFAULT 30,
          requireApproval boolean NOT NULL DEFAULT true,
          refreshRadarDaily boolean NOT NULL DEFAULT true,
          preferredAreas text,
          preferredFormats text,
          createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT automation_settings_id PRIMARY KEY(id),
          CONSTRAINT automation_settings_user_unique UNIQUE(userId)
        )
      `);
    }

    const finalBrandUnique = await indexExists(connection, "brand_profiles", "brand_profiles_user_unique");
    const finalAutomationTable = await tableExists(connection, "automation_settings");
    if (!finalBrandUnique || !finalAutomationTable) throw new Error("A verificação final da migration falhou.");

    console.log("[deploy] migration Social OS aplicada e verificada sem reset ou exclusão de dados.");
  } finally {
    await connection.end();
  }
}

main().catch(error => {
  console.error(`[deploy] FALHA: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
