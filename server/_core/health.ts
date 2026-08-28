import type { Express } from "express";
import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { ENV } from "./env";

function integrationState() {
  return {
    databaseConfigured: Boolean(ENV.databaseUrl),
    forgeConfigured: Boolean(ENV.forgeApiUrl && ENV.forgeApiKey),
    instagramConfigured: Boolean(ENV.metaInstagramAppId && ENV.metaInstagramAppSecret),
  };
}

export function registerHealthRoutes(app: Express) {
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "depaula-social-os",
      environment: ENV.isProduction ? "production" : "development",
      integrations: integrationState(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/ready", async (_req, res) => {
    const checks = {
      runtimeEnv: Boolean(ENV.appId && ENV.cookieSecret && ENV.databaseUrl && ENV.oAuthServerUrl),
      database: false,
      socialOsMigration: false,
    };

    try {
      const db = await getDb();
      if (db) {
        await db.execute(sql`SELECT 1`);
        checks.database = true;
        await db.execute(sql.raw("SELECT 1 FROM automation_settings LIMIT 1"));
        checks.socialOsMigration = true;
      }
    } catch (error) {
      console.warn("[Readiness] check failed", error instanceof Error ? error.message : error);
    }

    const ready = Object.values(checks).every(Boolean);
    res.status(ready ? 200 : 503).json({
      status: ready ? "ready" : "not_ready",
      checks,
      integrations: integrationState(),
      timestamp: new Date().toISOString(),
    });
  });
}
