import { createHash } from "node:crypto";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { automationExecutions, autonomyProfiles } from "../drizzle/socialAutomationSchema";
import { automationRules, contentOpportunities, socialInteractions } from "../drizzle/socialOsSchema";
import { getDb } from "./db";
import { createLead, recordAuditEvent } from "./socialOsDb";

function parseConfig(value: string) {
  try { return JSON.parse(value) as Record<string, unknown>; } catch { return {}; }
}

function fingerprint(ruleId: number, entityType: string, entityId: string, actionType: string) {
  return createHash("sha256").update(`${ruleId}:${entityType}:${entityId}:${actionType}`).digest("hex");
}

export async function getAutonomyProfile(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [existing] = await db.select().from(autonomyProfiles).where(eq(autonomyProfiles.userId, userId)).limit(1);
  if (existing) return existing;
  await db.insert(autonomyProfiles).values({ userId, level: "assisted", allowAutoResearch: true, allowAutoDraft: false, allowAutoSchedule: false, requireHumanForLegalContent: true, requireHumanForExternalPublish: true });
  const [created] = await db.select().from(autonomyProfiles).where(eq(autonomyProfiles.userId, userId)).limit(1);
  if (!created) throw new Error("Não foi possível criar o perfil de autonomia.");
  return created;
}

export async function updateAutonomyProfile(userId: number, input: {
  level: "manual" | "assisted" | "semi_automatic" | "autopilot";
  allowAutoResearch: boolean;
  allowAutoDraft: boolean;
  allowAutoSchedule: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await getAutonomyProfile(userId);
  await db.update(autonomyProfiles).set({
    ...input,
    requireHumanForLegalContent: true,
    requireHumanForExternalPublish: true,
    updatedAt: new Date(),
  }).where(eq(autonomyProfiles.userId, userId));
  const [profile] = await db.select().from(autonomyProfiles).where(eq(autonomyProfiles.userId, userId)).limit(1);
  return profile;
}

export async function listAutomationExecutions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  return db.select().from(automationExecutions).where(eq(automationExecutions.userId, userId)).orderBy(desc(automationExecutions.createdAt)).limit(100);
}

async function queueExecution(userId: number, rule: typeof automationRules.$inferSelect, entityType: string, entityId: string, trigger: unknown) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const profile = await getAutonomyProfile(userId);
  const requiresHuman = rule.requiresHumanApproval || profile.requireHumanForLegalContent || profile.level === "manual" || profile.level === "assisted";
  const fp = fingerprint(rule.id, entityType, entityId, rule.actionType);
  const [existing] = await db.select().from(automationExecutions).where(and(eq(automationExecutions.userId, userId), eq(automationExecutions.fingerprint, fp))).limit(1);
  if (existing) return existing;
  const result = await db.insert(automationExecutions).values({
    userId,
    ruleId: rule.id,
    fingerprint: fp,
    entityType,
    entityId,
    triggerSnapshotJson: JSON.stringify(trigger),
    actionSnapshotJson: rule.actionConfigJson,
    status: requiresHuman ? "pending_approval" : "queued",
    requiresHumanApproval: requiresHuman,
  });
  const [created] = await db.select().from(automationExecutions).where(eq(automationExecutions.id, Number(result[0].insertId))).limit(1);
  return created;
}

export async function scanAutomationRules(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const profile = await getAutonomyProfile(userId);
  if (profile.level === "manual") return { queued: 0, reason: "Perfil manual: nenhuma regra foi executada automaticamente." };
  const rules = await db.select().from(automationRules).where(and(eq(automationRules.userId, userId), eq(automationRules.enabled, true)));
  let queued = 0;

  for (const rule of rules) {
    const config = parseConfig(rule.triggerConfigJson);
    if (rule.triggerType === "opportunity_score") {
      const minScore = Math.max(0, Math.min(100, Number(config.minScore ?? 75)));
      const opportunities = await db.select().from(contentOpportunities)
        .where(and(eq(contentOpportunities.userId, userId), eq(contentOpportunities.status, "new"), gte(contentOpportunities.totalScore, minScore)))
        .orderBy(desc(contentOpportunities.totalScore)).limit(10);
      for (const item of opportunities) {
        const execution = await queueExecution(userId, rule, "content_opportunity", String(item.id), { totalScore: item.totalScore, title: item.title, sourceUrl: item.sourceUrl });
        if (execution?.createdAt && Date.now() - new Date(execution.createdAt).getTime() < 5_000) queued += 1;
      }
    }

    if (rule.triggerType === "interaction_kind") {
      const kinds = Array.isArray(config.kinds) ? config.kinds.map(String) : [String(config.kind ?? "opportunity")];
      const allowedKinds = kinds.filter((value): value is "question" | "praise" | "complaint" | "quote" | "support" | "opportunity" | "spam" | "legal_risk" | "sensitive" => ["question", "praise", "complaint", "quote", "support", "opportunity", "spam", "legal_risk", "sensitive"].includes(value));
      if (allowedKinds.length) {
        const interactions = await db.select().from(socialInteractions)
          .where(and(eq(socialInteractions.userId, userId), inArray(socialInteractions.kind, allowedKinds), inArray(socialInteractions.status, ["open", "triaged", "waiting_human"])))
          .orderBy(desc(socialInteractions.receivedAt)).limit(20);
        for (const item of interactions) {
          const execution = await queueExecution(userId, rule, "social_interaction", String(item.id), { kind: item.kind, body: item.body.slice(0, 500), requiresHumanApproval: item.requiresHumanApproval });
          if (execution?.createdAt && Date.now() - new Date(execution.createdAt).getTime() < 5_000) queued += 1;
        }
      }
    }
  }

  await recordAuditEvent(userId, "automation.scan_completed", "automation", null, { rules: rules.length, queued, level: profile.level });
  return { queued, rules: rules.length, level: profile.level };
}

export async function approveAutomationExecution(userId: number, executionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [execution] = await db.select().from(automationExecutions).where(and(eq(automationExecutions.userId, userId), eq(automationExecutions.id, executionId))).limit(1);
  if (!execution) throw new Error("Execução de automação não encontrada.");
  if (execution.status !== "pending_approval") throw new Error("Esta execução não está aguardando aprovação.");
  await db.update(automationExecutions).set({ status: "queued", approvedByUserId: userId, approvedAt: new Date(), updatedAt: new Date() }).where(eq(automationExecutions.id, execution.id));
  return executeAutomationExecution(userId, execution.id);
}

export async function executeAutomationExecution(userId: number, executionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [execution] = await db.select().from(automationExecutions).where(and(eq(automationExecutions.userId, userId), eq(automationExecutions.id, executionId))).limit(1);
  if (!execution) throw new Error("Execução de automação não encontrada.");
  if (![
    "queued",
  ].includes(execution.status)) throw new Error("A execução não está liberada para processamento.");

  const [rule] = await db.select().from(automationRules).where(and(eq(automationRules.userId, userId), eq(automationRules.id, execution.ruleId))).limit(1);
  if (!rule || !rule.enabled) throw new Error("A regra de origem não está ativa.");
  await db.update(automationExecutions).set({ status: "running", updatedAt: new Date() }).where(eq(automationExecutions.id, execution.id));

  try {
    let result: Record<string, unknown> = { action: rule.actionType, safeNoop: true };
    if (rule.actionType === "create_lead" && execution.entityType === "social_interaction") {
      const interactionId = Number(execution.entityId);
      const [interaction] = await db.select().from(socialInteractions).where(and(eq(socialInteractions.userId, userId), eq(socialInteractions.id, interactionId))).limit(1);
      if (!interaction) throw new Error("Interação de origem não encontrada.");
      if (["legal_risk", "sensitive", "complaint"].includes(interaction.kind)) throw new Error("Conversão automática em lead bloqueada para interação sensível; encaminhe para revisão humana.");
      const lead = await createLead(userId, { source: interaction.network, sourceInteractionId: interaction.id, name: interaction.authorName, contact: interaction.authorHandle, interest: interaction.body.slice(0, 255), notes: "Lead criado por regra de automação após aprovação/nível permitido.", status: "new" });
      result = { action: rule.actionType, leadId: lead?.id ?? null };
    }
    if (["create_draft", "request_approval", "suggest_reply", "create_report"].includes(rule.actionType)) {
      result = { action: rule.actionType, queuedForSpecializedModule: true, message: "A ação exige contexto especializado e foi mantida na camada segura; nenhuma publicação externa foi executada." };
    }
    await db.update(automationExecutions).set({ status: "completed", resultJson: JSON.stringify(result), errorMessage: null, updatedAt: new Date() }).where(eq(automationExecutions.id, execution.id));
    await recordAuditEvent(userId, "automation.execution_completed", "automation_execution", execution.id, result);
    return { ...execution, status: "completed" as const, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.update(automationExecutions).set({ status: "failed", errorMessage: message, updatedAt: new Date() }).where(eq(automationExecutions.id, execution.id));
    await recordAuditEvent(userId, "automation.execution_failed", "automation_execution", execution.id, { error: message });
    throw error;
  }
}
