import type { Express } from "express";
import { and, eq, gt, sql } from "drizzle-orm";
import { getDb } from "../db";
import { instagramConnections } from "../../drizzle/schema";
import { ENV } from "./env";

async function integrationState() {
  let instagramConnectionValidated = false;

  try {
    const db = await getDb();
    if (db) {
      const [connection] = await db
        .select({ id: instagramConnections.id })
        .from(instagramConnections)
        .where(and(
          eq(instagramConnections.state, "connected"),
          gt(instagramConnections.tokenExpiresAt, new Date()),
        ))
        .limit(1);
      instagramConnectionValidated = Boolean(connection);
    }
  } catch {
    instagramConnectionValidated = false;
  }

  return {
    databaseConfigured: Boolean(ENV.databaseUrl),
    forgeConfigured: Boolean(ENV.forgeApiUrl && ENV.forgeApiKey),
    instagramCredentialsConfigured: Boolean(ENV.metaInstagramAppId && ENV.metaInstagramAppSecret),
    instagramConnectionValidated,
  };
}

export function registerHealthRoutes(app: Express) {
  app.get("/api/health", async (_req, res) => {
    res.json({
      status: "ok",
      service: "depaula-social-os",
      environment: ENV.isProduction ? "production" : "development",
      integrations: await integrationState(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/ready", async (_req, res) => {
    const checks = {
      runtimeEnv: Boolean(ENV.appId && ENV.cookieSecret && ENV.databaseUrl && ENV.oAuthServerUrl),
      database: false,
      automationSettings: false,
      socialProfiles: false,
      governance: false,
      socialOsCore: false,
      growthModules: false,
    };

    try {
      const db = await getDb();
      if (db) {
        await db.execute(sql`SELECT 1`);
        checks.database = true;

        await db.execute(sql.raw("SELECT id, userId, postsPerWeek, requireApproval FROM automation_settings LIMIT 1"));
        checks.automationSettings = true;

        await db.execute(sql.raw("SELECT id, userId, network, state FROM social_profiles LIMIT 1"));
        checks.socialProfiles = true;

        await db.execute(sql.raw("SELECT id, postId, contentHash FROM post_versions LIMIT 1"));
        await db.execute(sql.raw("SELECT id, postId, versionId, contentHash FROM post_approval_bindings LIMIT 1"));
        checks.governance = true;

        await db.execute(sql.raw("SELECT id, userId, totalScore FROM content_opportunities LIMIT 1"));
        await db.execute(sql.raw("SELECT id, userId, idempotencyKey, timezone FROM campaign_runs LIMIT 1"));
        await db.execute(sql.raw("SELECT id, userId, kind, status FROM social_interactions LIMIT 1"));
        checks.socialOsCore = true;

        await db.execute(sql.raw("SELECT id, userId, status FROM video_projects LIMIT 1"));
        await db.execute(sql.raw("SELECT id, userId, scope, score FROM seo_audits LIMIT 1"));
        await db.execute(sql.raw("SELECT id, userId, platform, status FROM ad_plans LIMIT 1"));
        await db.execute(sql.raw("SELECT id, userId, checkType, result FROM compliance_checks LIMIT 1"));
        checks.growthModules = true;
      }
    } catch (error) {
      console.warn("[Readiness] check failed", error instanceof Error ? error.message : error);
    }

    const ready = Object.values(checks).every(Boolean);
    res.status(ready ? 200 : 503).json({
      status: ready ? "ready" : "not_ready",
      service: "depaula-social-os",
      checks,
      integrations: await integrationState(),
      timestamp: new Date().toISOString(),
    });
  });
}
