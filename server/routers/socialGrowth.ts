import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { addBrandMemory, addComplianceCheck, addInsight, completeAgentRun, createAdPlan, createReport, createSeoAudit, createVideoProject, getGrowthWorkspace, startAgentRun } from "../socialGrowthDb";
import { recordAuditEvent } from "../socialOsDb";

const jsonString = z.string().min(2).max(30000).refine(value => { try { JSON.parse(value); return true; } catch { return false; } }, "JSON inválido.");
const score = z.number().int().min(0).max(100);

export const socialGrowthRouter = router({
  workspace: protectedProcedure.query(({ ctx }) => getGrowthWorkspace(ctx.user.id)),

  createVideoProject: protectedProcedure.input(z.object({
    postId: z.number().int().positive().nullable(),
    title: z.string().min(3).max(255),
    platform: z.string().min(2).max(40),
    durationSeconds: z.number().int().min(5).max(1800),
    hook: z.string().max(5000).nullable(),
    script: z.string().max(30000).nullable(),
    shotListJson: jsonString.nullable(),
    onScreenTextJson: jsonString.nullable(),
    thumbnailBrief: z.string().max(5000).nullable(),
    recordingGuidance: z.string().max(10000).nullable(),
    status: z.enum(["brief", "scripted", "approved", "produced"]).default("brief"),
  })).mutation(async ({ ctx, input }) => {
    const row = await createVideoProject(ctx.user.id, input);
    await recordAuditEvent(ctx.user.id, "video_project.created", "video_project", row?.id);
    return row;
  }),

  createSeoAudit: protectedProcedure.input(z.object({
    scope: z.enum(["site", "local", "content", "technical"]),
    targetUrl: z.string().url().nullable(),
    location: z.string().max(180).nullable(),
    keyword: z.string().max(255).nullable(),
    score,
    findingsJson: jsonString,
    recommendationsJson: jsonString,
    status: z.enum(["draft", "ready", "applied", "archived"]).default("draft"),
  })).mutation(async ({ ctx, input }) => {
    const row = await createSeoAudit(ctx.user.id, input);
    await recordAuditEvent(ctx.user.id, "seo_audit.created", "seo_audit", row?.id, { scope: input.scope, score: input.score });
    return row;
  }),

  createAdPlan: protectedProcedure.input(z.object({
    platform: z.enum(["meta", "google", "youtube", "linkedin", "tiktok"]),
    name: z.string().min(3).max(180),
    objective: z.string().min(2).max(180),
    audienceJson: jsonString,
    locationJson: jsonString.nullable(),
    offer: z.string().max(5000).nullable(),
    budgetCents: z.number().int().min(0).nullable(),
    durationDays: z.number().int().min(1).max(365).nullable(),
    conversionEvent: z.string().max(120).nullable(),
    maxAcceptableCostCents: z.number().int().min(0).nullable(),
    successMetric: z.string().max(120).nullable(),
    creativeBriefJson: jsonString.nullable(),
    landingPageUrl: z.string().url().nullable(),
  })).mutation(async ({ ctx, input }) => {
    const row = await createAdPlan(ctx.user.id, input);
    await recordAuditEvent(ctx.user.id, "ad_plan.created", "ad_plan", row?.id, { platform: input.platform });
    return row;
  }),

  addInsight: protectedProcedure.input(z.object({
    insightType: z.enum(["topic", "format", "schedule", "cta", "audience", "channel"]),
    title: z.string().min(3).max(255),
    evidenceJson: jsonString,
    recommendation: z.string().min(3).max(10000),
    confidenceScore: score,
    active: z.boolean().default(true),
  })).mutation(({ ctx, input }) => addInsight(ctx.user.id, input)),

  addBrandMemory: protectedProcedure.input(z.object({
    memoryType: z.enum(["winning_pattern", "avoid_pattern", "audience_learning", "creative_rule", "copy_rule", "channel_rule"]),
    title: z.string().min(3).max(255),
    content: z.string().min(3).max(10000),
    sourceReference: z.string().max(1024).nullable(),
    confidenceScore: score,
    active: z.boolean().default(true),
  })).mutation(({ ctx, input }) => addBrandMemory(ctx.user.id, input)),

  startAgent: protectedProcedure.input(z.object({
    agentType: z.enum(["strategist", "researcher", "copywriter", "creative_director", "designer", "reviewer", "compliance", "publisher", "analyst"]),
    entityType: z.string().max(80).nullable(),
    entityId: z.string().max(120).nullable(),
    inputSummary: z.string().max(10000).nullable(),
    outputSummary: z.string().max(10000).nullable().default(null),
    status: z.enum(["started", "completed", "failed", "blocked_human"]).default("started"),
    durationMs: z.number().int().min(0).nullable().default(null),
    errorMessage: z.string().max(10000).nullable().default(null),
  })).mutation(({ ctx, input }) => startAgentRun(ctx.user.id, input)),

  completeAgent: protectedProcedure.input(z.object({
    id: z.number().int().positive(),
    status: z.enum(["completed", "failed", "blocked_human"]),
    outputSummary: z.string().max(10000).nullable(),
    durationMs: z.number().int().min(0).nullable(),
    errorMessage: z.string().max(10000).nullable(),
  })).mutation(({ ctx, input }) => {
    const { id, ...patch } = input;
    return completeAgentRun(ctx.user.id, id, patch);
  }),

  addComplianceCheck: protectedProcedure.input(z.object({
    postId: z.number().int().positive().nullable(),
    adPlanId: z.number().int().positive().nullable(),
    checkType: z.enum(["legal_advertising", "lgpd", "copyright", "source_integrity", "platform_policy", "brand_safety"]),
    result: z.enum(["passed", "warning", "blocked", "needs_human"]),
    findingsJson: jsonString,
    checkedBy: z.enum(["system", "human"]).default("system"),
  })).mutation(({ ctx, input }) => addComplianceCheck(ctx.user.id, input)),

  createReport: protectedProcedure.input(z.object({
    reportType: z.enum(["weekly", "monthly", "campaign", "executive"]),
    periodStart: z.date(),
    periodEnd: z.date(),
    summary: z.string().min(3).max(30000),
    metricsJson: jsonString,
    findingsJson: jsonString,
    recommendationsJson: jsonString,
  })).mutation(({ ctx, input }) => createReport(ctx.user.id, input)),
});
