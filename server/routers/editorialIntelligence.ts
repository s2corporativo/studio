import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { ensureDefaultBrandWorkspace, listWorkspacePostIds } from "../brandWorkspaceDb";
import { fetchCurrentRadar } from "../newsRadar";
import { getStudioData } from "../socialStudioDb";
import { assessContentOpportunity } from "../socialIntelligenceGenerator";
import { listOpportunities, recordAuditEvent, saveOpportunity } from "../socialOsDb";
import { buildContentFingerprint, highestSimilarity } from "../../shared/contentFingerprint";
import { scoreEditorialPotential } from "../../shared/editorialScoring";
import { assessHumanizationMix, inferHumanizationCategory } from "../../shared/humanizationPolicy";
import { compositionDirectiveFor } from "../../shared/visualRepetition";

export const editorialIntelligenceRouter = router({
  overview: protectedProcedure.query(async ({ ctx }) => {
    const [studio, workspace] = await Promise.all([
      getStudioData(ctx.user.id),
      ensureDefaultBrandWorkspace(ctx.user.id),
    ]);
    const workspacePostIds = workspace ? new Set(await listWorkspacePostIds(ctx.user.id, workspace.id)) : null;
    const recent = studio.posts.filter(post => !workspacePostIds || workspacePostIds.has(post.id)).slice(0, 20);
    const tone = workspace?.toneOfVoice ?? studio.brand?.toneOfVoice;
    const fingerprints = recent.map(post => buildContentFingerprint({
      title: post.title,
      hook: post.hook,
      caption: post.caption,
      area: post.area,
      audience: post.audience,
      objective: post.strategicObjective,
      pillar: post.contentPillar,
      campaign: post.campaign,
      funnelStage: post.funnelStage,
      format: post.format,
      visualFamily: compositionDirectiveFor(`${post.area}:${post.title}`).key,
      cta: post.cta,
      tone,
    }));
    const repetition = fingerprints.map((fingerprint, index) => ({
      postId: recent[index]?.id ?? 0,
      title: recent[index]?.title ?? "",
      ...highestSimilarity(fingerprint, fingerprints.filter((_, other) => other !== index)),
    })).sort((a, b) => b.score - a.score);
    const humanization = assessHumanizationMix(recent.map(post => ({ category: inferHumanizationCategory(post) })));
    const potential = recent.slice(0, 10).map(post => ({
      postId: post.id,
      title: post.title,
      ...scoreEditorialPotential({
        title: post.title,
        hook: post.hook,
        area: post.area,
        audience: post.audience,
        format: post.format,
        sourceUrl: post.legalSource,
      }),
    }));
    return {
      brandWorkspace: workspace ? { id: workspace.id, key: workspace.key, name: workspace.name } : null,
      recentCount: recent.length,
      repetition: {
        highest: repetition[0] ?? null,
        above70: repetition.filter(item => item.score >= 70).slice(0, 8),
      },
      humanization,
      potential,
      disclaimer: "Scores editoriais são heurísticas de priorização, não previsão de alcance, contratação ou resultado.",
    };
  }),

  refreshRadarOpportunities: protectedProcedure.input(z.object({ limit: z.number().int().min(1).max(8).default(5) })).mutation(async ({ ctx, input }) => {
    const [radar, studio, existing, workspace] = await Promise.all([
      fetchCurrentRadar(),
      getStudioData(ctx.user.id),
      listOpportunities(ctx.user.id),
      ensureDefaultBrandWorkspace(ctx.user.id),
    ]);
    const targetAudience = workspace?.targetAudience ?? studio.brand?.targetAudience;
    const locality = workspace?.location ?? studio.brand?.location ?? null;
    const knownUrls = new Set(existing.map(item => item.sourceUrl).filter(Boolean));
    const blocked = radar.filter(item => item.freshnessStatus === "expired" || item.freshnessStatus === "needs_date_verification" || !item.publishedAt || !item.summary);
    const candidates = radar
      .filter(item => !knownUrls.has(item.url))
      .filter(item => item.freshnessStatus === "fresh" || item.freshnessStatus === "aging")
      .filter(item => Boolean(item.publishedAt && item.summary))
      .slice(0, input.limit);
    const created = [];
    for (const item of candidates) {
      const [assessment, heuristic] = await Promise.all([
        assessContentOpportunity({
          title: item.title,
          summary: item.summary,
          source: item.source,
          sourceUrl: item.url,
          publishedAt: item.publishedAt,
          area: item.area,
          officialSourceScore: item.score,
          preferredAreas: studio.automation?.preferredAreas,
          targetAudience,
        }),
        Promise.resolve(scoreEditorialPotential({
          title: item.title,
          hook: item.summary,
          area: item.area,
          audience: targetAudience,
          format: "carousel",
          sourceUrl: item.url,
          sourceName: item.source,
          publishedAt: item.publishedAt,
        })),
      ]);
      const authorityScore = Math.round((assessment.authorityScore + heuristic.authorityScore) / 2);
      const commercialScore = Math.round((assessment.commercialScore + heuristic.commercialIntentScore) / 2);
      const row = await saveOpportunity(ctx.user.id, {
        sourceUrl: item.url,
        sourceName: item.source,
        title: item.title,
        summary: item.summary,
        area: item.area,
        locality,
        relevanceScore: assessment.relevanceScore,
        freshnessScore: assessment.freshnessScore,
        authorityScore,
        commercialScore,
        riskScore: assessment.riskScore,
        totalScore: assessment.totalScore,
        rationale: [
          assessment.rationale,
          workspace ? `Marca operacional: ${workspace.name} (${workspace.key}).` : "Marca operacional: Brand OS legado.",
          `Validade editorial: ${item.freshnessStatus}; consultado em ${item.consultedAt}; válido até ${item.validUntil}.`,
          `Heurística independente — autoridade ${heuristic.authorityScore}/100, engajamento ${heuristic.engagementScore}/100, intenção comercial ${heuristic.commercialIntentScore}/100.`,
          `Formato recomendado: ${assessment.recommendedFormat}.`,
        ].join("\n"),
        status: "new",
      });
      created.push({ ...row, brandWorkspaceId: workspace?.id ?? null, freshnessStatus: item.freshnessStatus, validUntil: item.validUntil, engagementScore: heuristic.engagementScore });
    }
    await recordAuditEvent(ctx.user.id, "radar.governed_opportunities_refreshed", "content_opportunity", null, {
      brandWorkspaceId: workspace?.id ?? null,
      requested: input.limit,
      created: created.length,
      blockedByFreshnessOrEvidence: blocked.length,
    });
    return { brandWorkspaceId: workspace?.id ?? null, created: created.length, blocked: blocked.length, opportunities: created };
  }),
});
