import { and, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { contentPosts } from "../../drizzle/schema";
import { contentMetrics } from "../../drizzle/socialOsSchema";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { fetchCurrentRadar } from "../newsRadar";
import { auditSeoPage } from "../seoAuditService";
import { createAdPlan, createReport, createSeoAudit, createVideoProject, addInsight, startAgentRun, completeAgentRun } from "../socialGrowthDb";
import { getBrandAutomationContext } from "../studioPlanningContextDb";
import { classifySocialInteraction, assessContentOpportunity, generateAdPlanningBrief, generatePerformanceNarrative, generateVideoBrief } from "../socialIntelligenceGenerator";
import { listInteractions, listOpportunities, recordAuditEvent, saveOpportunity, updateInteraction } from "../socialOsDb";

async function withAgentRun<T>(userId: number, agentType: "strategist" | "researcher" | "copywriter" | "creative_director" | "designer" | "reviewer" | "compliance" | "publisher" | "analyst", entityType: string, inputSummary: string, work: () => Promise<T>) {
  const startedAt = Date.now();
  const run = await startAgentRun(userId, { agentType, entityType, entityId: null, inputSummary, outputSummary: null, status: "started", durationMs: null, errorMessage: null });
  try {
    const result = await work();
    await completeAgentRun(userId, run.id, { status: "completed", outputSummary: "Execução concluída e persistida.", durationMs: Date.now() - startedAt, errorMessage: null });
    return result;
  } catch (error) {
    await completeAgentRun(userId, run.id, { status: "failed", outputSummary: null, durationMs: Date.now() - startedAt, errorMessage: error instanceof Error ? error.message.slice(0, 10_000) : String(error).slice(0, 10_000) });
    throw error;
  }
}

export const socialIntelligenceRouter = router({
  refreshRadarOpportunities: protectedProcedure.input(z.object({ limit: z.number().int().min(1).max(8).default(5) })).mutation(async ({ ctx, input }) => withAgentRun(ctx.user.id, "researcher", "content_opportunity", `Atualizar até ${input.limit} oportunidades a partir do radar oficial.`, async () => {
    const [radar, studio, existing] = await Promise.all([fetchCurrentRadar(), getBrandAutomationContext(ctx.user.id), listOpportunities(ctx.user.id)]);
    const knownUrls = new Set(existing.map(item => item.sourceUrl).filter(Boolean));
    const candidates = radar.filter(item => !knownUrls.has(item.url)).slice(0, input.limit);
    const created = [];
    for (const item of candidates) {
      const assessment = await assessContentOpportunity({
        title: item.title,
        summary: item.summary,
        source: item.source,
        sourceUrl: item.url,
        publishedAt: item.publishedAt,
        area: item.area,
        officialSourceScore: item.score,
        preferredAreas: studio.automation?.preferredAreas,
        targetAudience: studio.brand?.targetAudience,
      });
      const row = await saveOpportunity(ctx.user.id, {
        sourceUrl: item.url,
        sourceName: item.source,
        title: item.title,
        summary: item.summary,
        area: item.area,
        locality: studio.brand?.location ?? null,
        relevanceScore: assessment.relevanceScore,
        freshnessScore: assessment.freshnessScore,
        authorityScore: assessment.authorityScore,
        commercialScore: assessment.commercialScore,
        riskScore: assessment.riskScore,
        totalScore: assessment.totalScore,
        rationale: `${assessment.rationale}\nFormato recomendado: ${assessment.recommendedFormat}.`,
        status: "new",
      });
      created.push(row);
    }
    await recordAuditEvent(ctx.user.id, "radar.opportunities_refreshed", "content_opportunity", null, { requested: input.limit, created: created.length });
    return { created: created.length, opportunities: created };
  })),

  classifyInteraction: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => withAgentRun(ctx.user.id, "reviewer", "social_interaction", `Classificar interação ${input.id}.`, async () => {
    const interactions = await listInteractions(ctx.user.id);
    const interaction = interactions.find(item => item.id === input.id);
    if (!interaction) throw new Error("Interação não encontrada.");
    const result = await classifySocialInteraction({ network: interaction.network, body: interaction.body });
    const sensitive = result.requiresHumanApproval || result.kind === "legal_risk" || result.kind === "sensitive" || result.kind === "complaint";
    const updated = await updateInteraction(ctx.user.id, interaction.id, {
      kind: result.kind,
      status: sensitive ? "waiting_human" : "triaged",
      aiSuggestedReply: result.suggestedReply,
      requiresHumanApproval: sensitive,
    });
    await recordAuditEvent(ctx.user.id, "interaction.classified_by_ai", "social_interaction", interaction.id, { kind: result.kind, sensitive, rationale: result.rationale });
    return { interaction: updated, rationale: result.rationale };
  })),

  generateVideoProject: protectedProcedure.input(z.object({
    postId: z.number().int().positive().nullable(),
    title: z.string().min(4).max(255),
    platform: z.enum(["instagram", "facebook", "linkedin", "tiktok", "youtube"]),
    durationSeconds: z.number().int().min(10).max(600),
    audience: z.string().min(3).max(1000),
    objective: z.string().min(3).max(1000),
    source: z.string().max(2048).nullable(),
    tone: z.string().max(1000).nullable(),
  })).mutation(async ({ ctx, input }) => withAgentRun(ctx.user.id, "creative_director", "video_project", input.title, async () => {
    const brief = await generateVideoBrief(input);
    const row = await createVideoProject(ctx.user.id, {
      postId: input.postId,
      title: input.title,
      platform: input.platform,
      durationSeconds: input.durationSeconds,
      hook: brief.hook,
      script: brief.script,
      shotListJson: JSON.stringify(brief.shotList),
      onScreenTextJson: JSON.stringify(brief.onScreenText),
      thumbnailBrief: brief.thumbnailBrief,
      recordingGuidance: brief.recordingGuidance,
      status: "scripted",
    });
    await recordAuditEvent(ctx.user.id, "video_project.generated", "video_project", row?.id, { platform: input.platform });
    return row;
  })),

  auditSeo: protectedProcedure.input(z.object({
    targetUrl: z.string().url(),
    scope: z.enum(["site", "local", "content", "technical"]).default("technical"),
    location: z.string().max(180).nullable(),
    keyword: z.string().max(255).nullable(),
  })).mutation(async ({ ctx, input }) => withAgentRun(ctx.user.id, "analyst", "seo_audit", input.targetUrl, async () => {
    const audit = await auditSeoPage(input.targetUrl, input.location, input.keyword);
    const row = await createSeoAudit(ctx.user.id, {
      scope: input.scope,
      targetUrl: audit.finalUrl,
      location: input.location,
      keyword: input.keyword,
      score: audit.score,
      findingsJson: JSON.stringify({ findings: audit.findings, facts: audit.facts }),
      recommendationsJson: JSON.stringify(audit.recommendations),
      status: "ready",
    });
    await recordAuditEvent(ctx.user.id, "seo_audit.completed", "seo_audit", row?.id, { score: audit.score, targetUrl: audit.finalUrl });
    return row;
  })),

  planAds: protectedProcedure.input(z.object({
    platform: z.enum(["meta", "google", "youtube", "linkedin", "tiktok"]),
    name: z.string().min(3).max(180),
    objective: z.string().min(3).max(180),
    audience: z.string().min(3).max(3000),
    location: z.string().max(1000).nullable(),
    offer: z.string().max(3000).nullable(),
    budgetCents: z.number().int().min(0).nullable(),
    durationDays: z.number().int().min(1).max(365).nullable(),
    landingPageUrl: z.string().url().nullable(),
  })).mutation(async ({ ctx, input }) => withAgentRun(ctx.user.id, "strategist", "ad_plan", input.name, async () => {
    const plan = await generateAdPlanningBrief(input);
    const row = await createAdPlan(ctx.user.id, {
      platform: input.platform,
      name: input.name,
      objective: input.objective,
      audienceJson: JSON.stringify(plan.audience),
      locationJson: JSON.stringify(plan.location),
      offer: input.offer,
      budgetCents: input.budgetCents,
      durationDays: input.durationDays,
      conversionEvent: plan.conversionEvent,
      maxAcceptableCostCents: null,
      successMetric: plan.successMetric,
      creativeBriefJson: JSON.stringify({ creativeVariations: plan.creativeVariations, landingPageChecklist: plan.landingPageChecklist, risks: plan.risks, maxAcceptableCostGuidance: plan.maxAcceptableCostGuidance }),
      landingPageUrl: input.landingPageUrl,
    });
    await recordAuditEvent(ctx.user.id, "ad_plan.generated", "ad_plan", row?.id, { platform: input.platform, requiresApproval: true });
    return row;
  })),

  generatePerformanceReport: protectedProcedure.input(z.object({
    reportType: z.enum(["weekly", "monthly", "campaign", "executive"]),
    periodStart: z.date(),
    periodEnd: z.date(),
  })).mutation(async ({ ctx, input }) => withAgentRun(ctx.user.id, "analyst", "generated_report", input.reportType, async () => {
    if (input.periodEnd.getTime() <= input.periodStart.getTime()) throw new Error("O fim do período deve ser posterior ao início.");
    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível.");
    const rows = await db.select({
      postId: contentMetrics.postId,
      network: contentMetrics.network,
      impressions: contentMetrics.impressions,
      reach: contentMetrics.reach,
      likes: contentMetrics.likes,
      comments: contentMetrics.comments,
      shares: contentMetrics.shares,
      saves: contentMetrics.saves,
      clicks: contentMetrics.clicks,
      leads: contentMetrics.leads,
      title: contentPosts.title,
    }).from(contentMetrics)
      .leftJoin(contentPosts, eq(contentPosts.id, contentMetrics.postId))
      .where(and(eq(contentMetrics.userId, ctx.user.id), gte(contentMetrics.capturedAt, input.periodStart), lte(contentMetrics.capturedAt, input.periodEnd)))
      .orderBy(desc(contentMetrics.reach));

    const totals = rows.reduce((acc, row) => {
      acc.impressions += row.impressions; acc.reach += row.reach; acc.likes += row.likes; acc.comments += row.comments;
      acc.shares += row.shares; acc.saves += row.saves; acc.clicks += row.clicks; acc.leads += row.leads;
      return acc;
    }, { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0, leads: 0 });

    const narrative = await generatePerformanceNarrative({
      periodLabel: `${input.periodStart.toISOString()} a ${input.periodEnd.toISOString()}`,
      metrics: totals,
      topContent: rows.slice(0, 10).map(row => ({ title: row.title ?? `Conteúdo #${row.postId}`, network: row.network, reach: row.reach, impressions: row.impressions, likes: row.likes, comments: row.comments, shares: row.shares, saves: row.saves, clicks: row.clicks, leads: row.leads })),
    });

    const report = await createReport(ctx.user.id, {
      reportType: input.reportType,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      summary: narrative.summary,
      metricsJson: JSON.stringify(totals),
      findingsJson: JSON.stringify(narrative.findings),
      recommendationsJson: JSON.stringify(narrative.recommendations),
    });
    for (const insight of narrative.insights) {
      await addInsight(ctx.user.id, { insightType: insight.type, title: insight.title, evidenceJson: JSON.stringify({ evidence: insight.evidence, periodStart: input.periodStart, periodEnd: input.periodEnd }), recommendation: insight.recommendation, confidenceScore: insight.confidenceScore, active: true });
    }
    await recordAuditEvent(ctx.user.id, "performance_report.generated", "generated_report", report.id, { reportType: input.reportType, metricSnapshots: rows.length });
    return { reportId: report.id, summary: narrative.summary, metrics: totals, findings: narrative.findings, recommendations: narrative.recommendations, insightsCreated: narrative.insights.length };
  })),
});
