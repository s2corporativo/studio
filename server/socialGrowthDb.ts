import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { adPlans, agentRuns, brandMemoryItems, complianceChecks, generatedReports, performanceInsights, seoAudits, videoProjects } from "../drizzle/socialGrowthSchema";

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  return db;
}

export async function getGrowthWorkspace(userId: number) {
  const db = await dbOrThrow();
  const [videos, seo, ads, insights, memory, agents, compliance, reports] = await Promise.all([
    db.select().from(videoProjects).where(eq(videoProjects.userId, userId)).orderBy(desc(videoProjects.updatedAt)).limit(20),
    db.select().from(seoAudits).where(eq(seoAudits.userId, userId)).orderBy(desc(seoAudits.auditedAt)).limit(20),
    db.select().from(adPlans).where(eq(adPlans.userId, userId)).orderBy(desc(adPlans.updatedAt)).limit(20),
    db.select().from(performanceInsights).where(and(eq(performanceInsights.userId, userId), eq(performanceInsights.active, true))).orderBy(desc(performanceInsights.confidenceScore)).limit(20),
    db.select().from(brandMemoryItems).where(and(eq(brandMemoryItems.userId, userId), eq(brandMemoryItems.active, true))).orderBy(desc(brandMemoryItems.confidenceScore)).limit(20),
    db.select().from(agentRuns).where(eq(agentRuns.userId, userId)).orderBy(desc(agentRuns.createdAt)).limit(30),
    db.select().from(complianceChecks).where(eq(complianceChecks.userId, userId)).orderBy(desc(complianceChecks.createdAt)).limit(30),
    db.select().from(generatedReports).where(eq(generatedReports.userId, userId)).orderBy(desc(generatedReports.periodEnd)).limit(12),
  ]);
  return { videos, seo, ads, insights, memory, agents, compliance, reports };
}

export async function createVideoProject(userId: number, value: Omit<typeof videoProjects.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">) {
  const db = await dbOrThrow();
  const result = await db.insert(videoProjects).values({ ...value, userId });
  const [row] = await db.select().from(videoProjects).where(and(eq(videoProjects.id, Number(result[0].insertId)), eq(videoProjects.userId, userId))).limit(1);
  return row;
}

export async function createSeoAudit(userId: number, value: Omit<typeof seoAudits.$inferInsert, "id" | "userId" | "createdAt" | "auditedAt">) {
  const db = await dbOrThrow();
  const result = await db.insert(seoAudits).values({ ...value, userId });
  const [row] = await db.select().from(seoAudits).where(and(eq(seoAudits.id, Number(result[0].insertId)), eq(seoAudits.userId, userId))).limit(1);
  return row;
}

export async function createAdPlan(userId: number, value: Omit<typeof adPlans.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">) {
  const db = await dbOrThrow();
  const result = await db.insert(adPlans).values({ ...value, userId, requiresApproval: true, status: "draft" });
  const [row] = await db.select().from(adPlans).where(and(eq(adPlans.id, Number(result[0].insertId)), eq(adPlans.userId, userId))).limit(1);
  return row;
}

export async function addInsight(userId: number, value: Omit<typeof performanceInsights.$inferInsert, "id" | "userId" | "createdAt">) {
  const db = await dbOrThrow();
  const result = await db.insert(performanceInsights).values({ ...value, userId });
  return { id: Number(result[0].insertId) };
}

export async function addBrandMemory(userId: number, value: Omit<typeof brandMemoryItems.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">) {
  const db = await dbOrThrow();
  const result = await db.insert(brandMemoryItems).values({ ...value, userId });
  return { id: Number(result[0].insertId) };
}

export async function startAgentRun(userId: number, value: Omit<typeof agentRuns.$inferInsert, "id" | "userId" | "createdAt" | "completedAt">) {
  const db = await dbOrThrow();
  const result = await db.insert(agentRuns).values({ ...value, userId });
  return { id: Number(result[0].insertId) };
}

export async function completeAgentRun(userId: number, id: number, patch: Pick<typeof agentRuns.$inferInsert, "status" | "outputSummary" | "durationMs" | "errorMessage">) {
  const db = await dbOrThrow();
  await db.update(agentRuns).set({ ...patch, completedAt: new Date() }).where(and(eq(agentRuns.id, id), eq(agentRuns.userId, userId)));
  const [row] = await db.select().from(agentRuns).where(and(eq(agentRuns.id, id), eq(agentRuns.userId, userId))).limit(1);
  if (!row) throw new Error("Execução de agente não encontrada.");
  return row;
}

export async function addComplianceCheck(userId: number, value: Omit<typeof complianceChecks.$inferInsert, "id" | "userId" | "createdAt">) {
  const db = await dbOrThrow();
  const result = await db.insert(complianceChecks).values({ ...value, userId });
  return { id: Number(result[0].insertId) };
}

export async function createReport(userId: number, value: Omit<typeof generatedReports.$inferInsert, "id" | "userId" | "createdAt">) {
  const db = await dbOrThrow();
  const result = await db.insert(generatedReports).values({ ...value, userId });
  return { id: Number(result[0].insertId) };
}
