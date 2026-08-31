import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  auditEvents,
  automationRules,
  competitors,
  contentMetrics,
  contentOpportunities,
  creativeEvaluations,
  leads,
  socialInteractions,
} from "../drizzle/socialOsSchema";

function requireDb<T>(db: T | null | undefined): T {
  if (!db) throw new Error("Banco de dados indisponível.");
  return db;
}

export async function listOpportunities(userId: number) {
  const db = requireDb(await getDb());
  return db.select().from(contentOpportunities).where(eq(contentOpportunities.userId, userId)).orderBy(desc(contentOpportunities.totalScore), desc(contentOpportunities.detectedAt));
}

export async function saveOpportunity(userId: number, input: Omit<typeof contentOpportunities.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt" | "detectedAt">) {
  const db = requireDb(await getDb());
  const result = await db.insert(contentOpportunities).values({ ...input, userId });
  const id = Number(result[0].insertId);
  const [row] = await db.select().from(contentOpportunities).where(and(eq(contentOpportunities.id, id), eq(contentOpportunities.userId, userId))).limit(1);
  return row;
}

export async function updateOpportunityStatus(userId: number, id: number, status: typeof contentOpportunities.$inferSelect.status) {
  const db = requireDb(await getDb());
  await db.update(contentOpportunities).set({ status, updatedAt: new Date() }).where(and(eq(contentOpportunities.id, id), eq(contentOpportunities.userId, userId)));
  const [row] = await db.select().from(contentOpportunities).where(and(eq(contentOpportunities.id, id), eq(contentOpportunities.userId, userId))).limit(1);
  if (!row) throw new Error("Oportunidade não encontrada.");
  return row;
}

export async function listInteractions(userId: number) {
  const db = requireDb(await getDb());
  return db.select().from(socialInteractions).where(eq(socialInteractions.userId, userId)).orderBy(desc(socialInteractions.receivedAt));
}

export async function createInteraction(userId: number, input: Omit<typeof socialInteractions.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt" | "receivedAt">) {
  const db = requireDb(await getDb());
  const result = await db.insert(socialInteractions).values({ ...input, userId });
  const id = Number(result[0].insertId);
  const [row] = await db.select().from(socialInteractions).where(and(eq(socialInteractions.id, id), eq(socialInteractions.userId, userId))).limit(1);
  return row;
}

export async function updateInteraction(userId: number, id: number, patch: Partial<Pick<typeof socialInteractions.$inferInsert, "kind" | "status" | "aiSuggestedReply" | "requiresHumanApproval">>) {
  const db = requireDb(await getDb());
  await db.update(socialInteractions).set({ ...patch, updatedAt: new Date() }).where(and(eq(socialInteractions.id, id), eq(socialInteractions.userId, userId)));
  const [row] = await db.select().from(socialInteractions).where(and(eq(socialInteractions.id, id), eq(socialInteractions.userId, userId))).limit(1);
  if (!row) throw new Error("Interação não encontrada.");
  return row;
}

export async function listLeads(userId: number) {
  const db = requireDb(await getDb());
  return db.select().from(leads).where(eq(leads.userId, userId)).orderBy(desc(leads.createdAt));
}

export async function createLead(userId: number, input: Omit<typeof leads.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">) {
  const db = requireDb(await getDb());
  const result = await db.insert(leads).values({ ...input, userId });
  const id = Number(result[0].insertId);
  const [row] = await db.select().from(leads).where(and(eq(leads.id, id), eq(leads.userId, userId))).limit(1);
  return row;
}

export async function updateLeadStatus(userId: number, id: number, status: typeof leads.$inferSelect.status) {
  const db = requireDb(await getDb());
  await db.update(leads).set({ status, updatedAt: new Date() }).where(and(eq(leads.id, id), eq(leads.userId, userId)));
  const [row] = await db.select().from(leads).where(and(eq(leads.id, id), eq(leads.userId, userId))).limit(1);
  if (!row) throw new Error("Lead não encontrado.");
  return row;
}

export async function listCompetitors(userId: number) {
  const db = requireDb(await getDb());
  return db.select().from(competitors).where(eq(competitors.userId, userId)).orderBy(desc(competitors.createdAt));
}

export async function createCompetitor(userId: number, input: Omit<typeof competitors.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">) {
  const db = requireDb(await getDb());
  const result = await db.insert(competitors).values({ ...input, userId });
  const id = Number(result[0].insertId);
  const [row] = await db.select().from(competitors).where(and(eq(competitors.id, id), eq(competitors.userId, userId))).limit(1);
  return row;
}

export async function addMetricSnapshot(userId: number, input: Omit<typeof contentMetrics.$inferInsert, "id" | "userId" | "capturedAt">) {
  const db = requireDb(await getDb());
  const result = await db.insert(contentMetrics).values({ ...input, userId });
  return { id: Number(result[0].insertId) };
}

export async function addCreativeEvaluation(userId: number, input: Omit<typeof creativeEvaluations.$inferInsert, "id" | "userId" | "createdAt">) {
  const db = requireDb(await getDb());
  const result = await db.insert(creativeEvaluations).values({ ...input, userId });
  return { id: Number(result[0].insertId) };
}

export async function listAutomationRules(userId: number) {
  const db = requireDb(await getDb());
  return db.select().from(automationRules).where(eq(automationRules.userId, userId)).orderBy(desc(automationRules.createdAt));
}

export async function createAutomationRule(userId: number, input: Omit<typeof automationRules.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">) {
  const db = requireDb(await getDb());
  const result = await db.insert(automationRules).values({ ...input, userId });
  const id = Number(result[0].insertId);
  const [row] = await db.select().from(automationRules).where(and(eq(automationRules.id, id), eq(automationRules.userId, userId))).limit(1);
  return row;
}

export async function setAutomationRuleEnabled(userId: number, id: number, enabled: boolean) {
  const db = requireDb(await getDb());
  await db.update(automationRules).set({ enabled, updatedAt: new Date() }).where(and(eq(automationRules.id, id), eq(automationRules.userId, userId)));
  const [row] = await db.select().from(automationRules).where(and(eq(automationRules.id, id), eq(automationRules.userId, userId))).limit(1);
  if (!row) throw new Error("Regra de automação não encontrada.");
  return row;
}

export async function recordAuditEvent(userId: number, action: string, entityType: string, entityId?: string | number | null, detail?: unknown) {
  const db = requireDb(await getDb());
  await db.insert(auditEvents).values({
    userId,
    actorUserId: userId,
    entityType,
    entityId: entityId == null ? null : String(entityId),
    action,
    detailJson: detail === undefined ? null : JSON.stringify(detail),
  });
}

export async function getSocialOsDashboard(userId: number) {
  const db = requireDb(await getDb());
  const [opportunityCount] = await db.select({ count: sql<number>`count(*)` }).from(contentOpportunities).where(and(eq(contentOpportunities.userId, userId), eq(contentOpportunities.status, "new")));
  const [interactionCount] = await db.select({ count: sql<number>`count(*)` }).from(socialInteractions).where(and(eq(socialInteractions.userId, userId), eq(socialInteractions.status, "open")));
  const [humanCount] = await db.select({ count: sql<number>`count(*)` }).from(socialInteractions).where(and(eq(socialInteractions.userId, userId), eq(socialInteractions.requiresHumanApproval, true)));
  const [leadCount] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(and(eq(leads.userId, userId), eq(leads.status, "new")));
  const topOpportunities = await db.select().from(contentOpportunities).where(and(eq(contentOpportunities.userId, userId), eq(contentOpportunities.status, "new"))).orderBy(desc(contentOpportunities.totalScore)).limit(5);
  return {
    newOpportunities: Number(opportunityCount?.count ?? 0),
    openInteractions: Number(interactionCount?.count ?? 0),
    waitingHuman: Number(humanCount?.count ?? 0),
    newLeads: Number(leadCount?.count ?? 0),
    topOpportunities,
  };
}
