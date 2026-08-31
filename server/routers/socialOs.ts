import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  addCreativeEvaluation,
  addMetricSnapshot,
  createAutomationRule,
  createCompetitor,
  createInteraction,
  createLead,
  getSocialOsDashboard,
  listAutomationRules,
  listCompetitors,
  listInteractions,
  listLeads,
  listOpportunities,
  recordAuditEvent,
  saveOpportunity,
  setAutomationRuleEnabled,
  updateInteraction,
  updateLeadStatus,
  updateOpportunityStatus,
} from "../socialOsDb";

const boundedScore = z.number().int().min(0).max(100);

export const socialOsRouter = router({
  dashboard: protectedProcedure.query(({ ctx }) => getSocialOsDashboard(ctx.user.id)),

  opportunities: protectedProcedure.query(({ ctx }) => listOpportunities(ctx.user.id)),
  createOpportunity: protectedProcedure.input(z.object({
    sourceUrl: z.string().url().nullable(),
    sourceName: z.string().max(180).nullable(),
    title: z.string().min(5).max(500),
    summary: z.string().max(5000).nullable(),
    area: z.string().max(120).nullable(),
    locality: z.string().max(180).nullable(),
    relevanceScore: boundedScore,
    freshnessScore: boundedScore,
    authorityScore: boundedScore,
    commercialScore: boundedScore,
    riskScore: boundedScore,
    totalScore: boundedScore,
    rationale: z.string().max(5000).nullable(),
    status: z.enum(["new", "selected", "dismissed", "converted"]).default("new"),
  })).mutation(async ({ ctx, input }) => {
    const row = await saveOpportunity(ctx.user.id, input);
    await recordAuditEvent(ctx.user.id, "opportunity.created", "content_opportunity", row?.id, { totalScore: input.totalScore });
    return row;
  }),
  setOpportunityStatus: protectedProcedure.input(z.object({
    id: z.number().int().positive(),
    status: z.enum(["new", "selected", "dismissed", "converted"]),
  })).mutation(async ({ ctx, input }) => {
    const row = await updateOpportunityStatus(ctx.user.id, input.id, input.status);
    await recordAuditEvent(ctx.user.id, "opportunity.status_changed", "content_opportunity", input.id, { status: input.status });
    return row;
  }),

  interactions: protectedProcedure.query(({ ctx }) => listInteractions(ctx.user.id)),
  ingestInteraction: protectedProcedure.input(z.object({
    socialProfileId: z.number().int().positive().nullable(),
    network: z.string().min(2).max(40),
    externalId: z.string().max(180).nullable(),
    authorName: z.string().max(180).nullable(),
    authorHandle: z.string().max(180).nullable(),
    body: z.string().min(1).max(10000),
    kind: z.enum(["question", "praise", "complaint", "quote", "support", "opportunity", "spam", "legal_risk", "sensitive"]).default("question"),
    status: z.enum(["open", "triaged", "waiting_human", "resolved", "ignored"]).default("open"),
    aiSuggestedReply: z.string().max(10000).nullable(),
    requiresHumanApproval: z.boolean().default(false),
  })).mutation(async ({ ctx, input }) => {
    const row = await createInteraction(ctx.user.id, input);
    await recordAuditEvent(ctx.user.id, "interaction.ingested", "social_interaction", row?.id, { kind: input.kind, network: input.network });
    return row;
  }),
  triageInteraction: protectedProcedure.input(z.object({
    id: z.number().int().positive(),
    kind: z.enum(["question", "praise", "complaint", "quote", "support", "opportunity", "spam", "legal_risk", "sensitive"]),
    status: z.enum(["open", "triaged", "waiting_human", "resolved", "ignored"]),
    aiSuggestedReply: z.string().max(10000).nullable(),
    requiresHumanApproval: z.boolean(),
  })).mutation(async ({ ctx, input }) => {
    const { id, ...patch } = input;
    const row = await updateInteraction(ctx.user.id, id, patch);
    await recordAuditEvent(ctx.user.id, "interaction.triaged", "social_interaction", id, patch);
    return row;
  }),

  leads: protectedProcedure.query(({ ctx }) => listLeads(ctx.user.id)),
  createLead: protectedProcedure.input(z.object({
    source: z.string().min(2).max(120),
    sourceInteractionId: z.number().int().positive().nullable(),
    name: z.string().max(180).nullable(),
    contact: z.string().max(320).nullable(),
    interest: z.string().max(255).nullable(),
    notes: z.string().max(5000).nullable(),
    status: z.enum(["new", "qualified", "contacted", "won", "lost"]).default("new"),
  })).mutation(async ({ ctx, input }) => {
    const row = await createLead(ctx.user.id, input);
    await recordAuditEvent(ctx.user.id, "lead.created", "lead", row?.id, { source: input.source });
    return row;
  }),
  setLeadStatus: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["new", "qualified", "contacted", "won", "lost"]) })).mutation(async ({ ctx, input }) => {
    const row = await updateLeadStatus(ctx.user.id, input.id, input.status);
    await recordAuditEvent(ctx.user.id, "lead.status_changed", "lead", input.id, { status: input.status });
    return row;
  }),

  competitors: protectedProcedure.query(({ ctx }) => listCompetitors(ctx.user.id)),
  createCompetitor: protectedProcedure.input(z.object({
    name: z.string().min(2).max(180),
    websiteUrl: z.string().url().nullable(),
    instagramUrl: z.string().url().nullable(),
    linkedinUrl: z.string().url().nullable(),
    notes: z.string().max(5000).nullable(),
    active: z.boolean().default(true),
  })).mutation(async ({ ctx, input }) => {
    const row = await createCompetitor(ctx.user.id, input);
    await recordAuditEvent(ctx.user.id, "competitor.created", "competitor", row?.id);
    return row;
  }),

  addMetricSnapshot: protectedProcedure.input(z.object({
    postId: z.number().int().positive(),
    network: z.string().min(2).max(40),
    impressions: z.number().int().min(0).default(0), reach: z.number().int().min(0).default(0),
    likes: z.number().int().min(0).default(0), comments: z.number().int().min(0).default(0),
    shares: z.number().int().min(0).default(0), saves: z.number().int().min(0).default(0),
    clicks: z.number().int().min(0).default(0), leads: z.number().int().min(0).default(0),
  })).mutation(async ({ ctx, input }) => {
    const row = await addMetricSnapshot(ctx.user.id, input);
    await recordAuditEvent(ctx.user.id, "metrics.snapshot_added", "content_post", input.postId, { network: input.network });
    return row;
  }),

  evaluateCreative: protectedProcedure.input(z.object({
    postId: z.number().int().positive(), mediaUrl: z.string().min(1).max(2048),
    visualQuality: boundedScore, brandFit: boundedScore, legibility: boundedScore,
    attentionPotential: boundedScore, aiAppearanceRisk: boundedScore,
    notes: z.string().max(5000).nullable(), passed: z.boolean(),
  })).mutation(async ({ ctx, input }) => {
    const row = await addCreativeEvaluation(ctx.user.id, input);
    await recordAuditEvent(ctx.user.id, "creative.evaluated", "content_post", input.postId, { passed: input.passed });
    return row;
  }),

  automationRules: protectedProcedure.query(({ ctx }) => listAutomationRules(ctx.user.id)),
  createAutomationRule: protectedProcedure.input(z.object({
    name: z.string().min(2).max(180), enabled: z.boolean().default(false),
    triggerType: z.enum(["schedule", "opportunity_score", "interaction_kind", "metric_threshold"]),
    triggerConfigJson: z.string().min(2).max(10000),
    actionType: z.enum(["create_draft", "request_approval", "suggest_reply", "create_lead", "create_report"]),
    actionConfigJson: z.string().min(2).max(10000),
    requiresHumanApproval: z.boolean().default(true),
  })).mutation(async ({ ctx, input }) => {
    JSON.parse(input.triggerConfigJson); JSON.parse(input.actionConfigJson);
    const row = await createAutomationRule(ctx.user.id, input);
    await recordAuditEvent(ctx.user.id, "automation_rule.created", "automation_rule", row?.id, { enabled: input.enabled });
    return row;
  }),
  setAutomationEnabled: protectedProcedure.input(z.object({ id: z.number().int().positive(), enabled: z.boolean() })).mutation(async ({ ctx, input }) => {
    const row = await setAutomationRuleEnabled(ctx.user.id, input.id, input.enabled);
    await recordAuditEvent(ctx.user.id, "automation_rule.toggled", "automation_rule", input.id, { enabled: input.enabled });
    return row;
  }),
});
