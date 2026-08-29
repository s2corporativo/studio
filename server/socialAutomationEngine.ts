import { createHash } from "node:crypto";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { automationExecutions, autonomyProfiles } from "../drizzle/socialAutomationSchema";
import { automationRules, contentOpportunities, socialInteractions } from "../drizzle/socialOsSchema";
import { getBrandProfile } from "./brandProfileDb";
import { getDb } from "./db";
import { createLead, recordAuditEvent, updateInteraction } from "./socialOsDb";
import { createStudioPost, getOrCreateContentSource } from "./socialStudioDb";
import { generateLegalDraft } from "./socialStudioGenerator";

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
  await db.update(autonomyProfiles).set({ ...input, requireHumanForLegalContent: true, requireHumanForExternalPublish: true, updatedAt: new Date() }).where(eq(autonomyProfiles.userId, userId));
  const [profile] = await db.select().from(autonomyProfiles).where(eq(autonomyProfiles.userId, userId)).limit(1);
  return profile;
}

export async function listAutomationExecutions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  return db.select().from(automationExecutions).where(eq(automationExecutions.userId, userId)).orderBy(desc(automationExecutions.createdAt)).limit(100);
}

function actionMayRunWithoutHuman(rule: typeof automationRules.$inferSelect, profile: typeof autonomyProfiles.$inferSelect, trigger: unknown) {
  const triggerRecord = trigger && typeof trigger === "object" && !Array.isArray(trigger)
    ? trigger as Record<string, unknown>
    : {};
  if (rule.requiresHumanApproval || profile.level === "manual" || profile.level === "assisted") return false;
  if (triggerRecord.requiresHumanApproval === true) return false;
  if (["legal_risk", "sensitive", "complaint"].includes(String(triggerRecord.kind ?? ""))) return false;
  if (rule.actionType === "create_draft") return profile.allowAutoDraft;
  if (rule.actionType === "request_approval") return true;
  if (rule.actionType === "suggest_reply") return profile.level === "autopilot";
  if (rule.actionType === "create_lead") return profile.level === "autopilot";
  if (rule.actionType === "create_report") return profile.level === "semi_automatic" || profile.level === "autopilot";
  return false;
}

async function queueExecution(userId: number, rule: typeof automationRules.$inferSelect, entityType: string, entityId: string, trigger: unknown) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const profile = await getAutonomyProfile(userId);
  const requiresHuman = !actionMayRunWithoutHuman(rule, profile, trigger);
  const fp = fingerprint(rule.id, entityType, entityId, rule.actionType);
  const [existing] = await db.select().from(automationExecutions).where(and(eq(automationExecutions.userId, userId), eq(automationExecutions.fingerprint, fp))).limit(1);
  if (existing) return { row: existing, created: false };
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
  return { row: created, created: true };
}

export async function scanAutomationRules(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const profile = await getAutonomyProfile(userId);
  if (profile.level === "manual") return { queued: 0, executed: 0, reason: "Perfil manual: nenhuma regra foi processada automaticamente." };
  if (!profile.allowAutoResearch) return { queued: 0, executed: 0, reason: "Pesquisa automática está desativada no perfil de autonomia." };
  const rules = await db.select().from(automationRules).where(and(eq(automationRules.userId, userId), eq(automationRules.enabled, true)));
  let queued = 0;
  let executed = 0;

  const enqueue = async (rule: typeof automationRules.$inferSelect, entityType: string, entityId: string, trigger: unknown) => {
    const item = await queueExecution(userId, rule, entityType, entityId, trigger);
    if (!item.created || !item.row) return;
    queued += 1;
    if (item.row.status === "queued") {
      await executeAutomationExecution(userId, item.row.id);
      executed += 1;
    }
  };

  for (const rule of rules) {
    const config = parseConfig(rule.triggerConfigJson);
    if (rule.triggerType === "opportunity_score") {
      const minScore = Math.max(0, Math.min(100, Number(config.minScore ?? 75)));
      const opportunities = await db.select().from(contentOpportunities)
        .where(and(eq(contentOpportunities.userId, userId), eq(contentOpportunities.status, "new"), gte(contentOpportunities.totalScore, minScore)))
        .orderBy(desc(contentOpportunities.totalScore)).limit(10);
      for (const item of opportunities) await enqueue(rule, "content_opportunity", String(item.id), { totalScore: item.totalScore, title: item.title, sourceUrl: item.sourceUrl, sourceName: item.sourceName, area: item.area });
    }

    if (rule.triggerType === "interaction_kind") {
      const kinds = Array.isArray(config.kinds) ? config.kinds.map(String) : [String(config.kind ?? "opportunity")];
      const allowedKinds = kinds.filter((value): value is "question" | "praise" | "complaint" | "quote" | "support" | "opportunity" | "spam" | "legal_risk" | "sensitive" => ["question", "praise", "complaint", "quote", "support", "opportunity", "spam", "legal_risk", "sensitive"].includes(value));
      if (allowedKinds.length) {
        const interactions = await db.select().from(socialInteractions)
          .where(and(eq(socialInteractions.userId, userId), inArray(socialInteractions.kind, allowedKinds), inArray(socialInteractions.status, ["open", "triaged", "waiting_human"])))
          .orderBy(desc(socialInteractions.receivedAt)).limit(20);
        for (const item of interactions) await enqueue(rule, "social_interaction", String(item.id), { kind: item.kind, body: item.body.slice(0, 500), requiresHumanApproval: item.requiresHumanApproval });
      }
    }
  }

  await recordAuditEvent(userId, "automation.scan_completed", "automation", null, { rules: rules.length, queued, executed, level: profile.level });
  return { queued, executed, rules: rules.length, level: profile.level };
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
  if (execution.status !== "queued") throw new Error("A execução não está liberada para processamento.");

  const [rule] = await db.select().from(automationRules).where(and(eq(automationRules.userId, userId), eq(automationRules.id, execution.ruleId))).limit(1);
  if (!rule || !rule.enabled) throw new Error("A regra de origem não está ativa.");
  await db.update(automationExecutions).set({ status: "running", updatedAt: new Date() }).where(eq(automationExecutions.id, execution.id));

  try {
    let result: Record<string, unknown> = { action: rule.actionType };

    if (rule.actionType === "create_draft" && execution.entityType === "content_opportunity") {
      const opportunityId = Number(execution.entityId);
      const [opportunity] = await db.select().from(contentOpportunities).where(and(eq(contentOpportunities.userId, userId), eq(contentOpportunities.id, opportunityId))).limit(1);
      if (!opportunity) throw new Error("Oportunidade de origem não encontrada.");
      const brand = await getBrandProfile(userId);
      const source = opportunity.sourceUrl ? await getOrCreateContentSource(userId, {
        title: opportunity.sourceName ?? "Fonte do Radar",
        sourceType: "radar / fonte verificável",
        url: opportunity.sourceUrl,
        notes: opportunity.summary,
      }) : null;
      const generated = await generateLegalDraft({
        area: opportunity.area ?? "Geral",
        topic: opportunity.title,
        audience: brand.targetAudience ?? "Público institucional",
        format: "post",
        objective: "Atualidade e autoridade técnica",
        legalSource: opportunity.sourceUrl,
        primaryCta: brand.primaryCta,
        toneOfVoice: brand.toneOfVoice,
        prohibitedTerms: brand.prohibitedTerms,
      });
      const post = await createStudioPost(userId, {
        topicId: null,
        sourceId: source?.id ?? null,
        area: opportunity.area ?? "Geral",
        audience: brand.targetAudience ?? "Público institucional",
        format: "post",
        strategicObjective: "Atualidade e autoridade técnica",
        contentPillar: "Radar",
        campaign: "Autopilot seguro",
        funnelStage: "discovery",
        templateKey: "radar_auto_draft",
        title: generated.title,
        hook: generated.hook,
        caption: generated.caption,
        cta: generated.cta,
        hashtags: generated.hashtags,
        altText: generated.altText,
        keyStatement: generated.hook,
        legalSource: opportunity.sourceUrl,
        reviewDueAt: new Date(Date.now() + 7 * 86_400_000),
        status: "draft",
      });
      await db.update(contentOpportunities).set({ status: "converted", updatedAt: new Date() }).where(eq(contentOpportunities.id, opportunity.id));
      result = { action: rule.actionType, postId: post?.id ?? null, sourceId: source?.id ?? null, externalPublish: false };
    } else if (rule.actionType === "create_lead" && execution.entityType === "social_interaction") {
      const interactionId = Number(execution.entityId);
      const [interaction] = await db.select().from(socialInteractions).where(and(eq(socialInteractions.userId, userId), eq(socialInteractions.id, interactionId))).limit(1);
      if (!interaction) throw new Error("Interação de origem não encontrada.");
      if (["legal_risk", "sensitive", "complaint"].includes(interaction.kind)) throw new Error("Conversão automática em lead bloqueada para interação sensível; encaminhe para revisão humana.");
      const lead = await createLead(userId, { source: interaction.network, sourceInteractionId: interaction.id, name: interaction.authorName, contact: interaction.authorHandle, interest: interaction.body.slice(0, 255), notes: "Lead criado por regra de automação interna. Nenhum contato externo foi enviado automaticamente.", status: "new" });
      result = { action: rule.actionType, leadId: lead?.id ?? null, externalMessageSent: false };
    } else if (rule.actionType === "suggest_reply" && execution.entityType === "social_interaction") {
      const interactionId = Number(execution.entityId);
      const [interaction] = await db.select().from(socialInteractions).where(and(eq(socialInteractions.userId, userId), eq(socialInteractions.id, interactionId))).limit(1);
      if (!interaction) throw new Error("Interação de origem não encontrada.");
      if (!interaction.aiSuggestedReply) throw new Error("A interação ainda não possui resposta sugerida. Execute a triagem inteligente antes.");
      await updateInteraction(userId, interaction.id, { status: interaction.requiresHumanApproval ? "waiting_human" : "triaged" });
      result = { action: rule.actionType, interactionId: interaction.id, suggestionReady: true, externalMessageSent: false };
    } else if (rule.actionType === "request_approval") {
      result = { action: rule.actionType, approvalRequested: true, message: "A automação sinalizou a necessidade de aprovação, sem alterar o conteúdo nem publicar externamente." };
    } else if (rule.actionType === "create_report") {
      result = { action: rule.actionType, reportQueued: true, message: "A regra foi processada; a geração de relatório permanece no módulo de Relatórios IA para preservar período e evidências." };
    } else {
      result = { action: rule.actionType, safeNoop: true, message: "Combinação de ação e entidade não suportada; nenhuma ação externa foi executada." };
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
