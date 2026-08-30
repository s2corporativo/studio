import { z } from "zod";
import { editorialFormats } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { AI_TEXT_LIMIT, consumeRateLimit } from "../_core/rateLimit";
import { archiveBrandWorkspace, bindPostToBrandWorkspace, createBrandWorkspace, getBrandWorkspace, getPostBrandWorkspace, listBrandWorkspaces, listPerformanceLearnings, setDefaultBrandWorkspace, updateBrandWorkspace } from "../brandWorkspaceDb";
import { createBrandBoundPost } from "../brandWorkspaceContentDb";
import { fetchCurrentRadar } from "../newsRadar";
import { learnBrandPerformance } from "../performanceLearningEngine";
import { recordAuditEvent } from "../socialOsDb";
import { getOrCreateContentSource, getStudioData, getStudioPost, updateStudioPost } from "../socialStudioDb";
import { generateLegalDraft } from "../socialStudioGenerator";
import { canSubmitForReview } from "../studioRules";

const nullableText = (max: number) => z.string().trim().max(max).nullable();
const formatSchema = z.enum(editorialFormats);
const workspacePayload = z.object({
  name: z.string().trim().min(2).max(180),
  segment: nullableText(180),
  location: nullableText(180),
  targetAudience: nullableText(6000),
  commercialGoal: nullableText(6000),
  toneOfVoice: nullableText(6000),
  primaryCta: nullableText(3000),
  prohibitedTerms: nullableText(6000),
  visualGuidelines: nullableText(10_000),
  websiteUrl: z.string().url().max(1024).nullable(),
  whatsapp: nullableText(80),
});

function assertActiveWorkspace(workspace: Awaited<ReturnType<typeof getBrandWorkspace>>) {
  if (workspace.status !== "active") throw new Error("A marca selecionada não está ativa.");
  return workspace;
}

function brandDraftContext(workspace: Awaited<ReturnType<typeof getBrandWorkspace>>) {
  return {
    primaryCta: workspace.primaryCta,
    toneOfVoice: workspace.toneOfVoice,
    prohibitedTerms: workspace.prohibitedTerms,
    brandName: workspace.name,
    brandPositioning: workspace.commercialGoal,
    brandAudience: workspace.targetAudience,
  };
}

export const brandWorkspacesRouter = router({
  list: protectedProcedure.query(({ ctx }) => listBrandWorkspaces(ctx.user.id)),

  get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ ctx, input }) => getBrandWorkspace(ctx.user.id, input.id)),

  create: protectedProcedure.input(workspacePayload.extend({ key: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) })).mutation(async ({ ctx, input }) => {
    const workspace = await createBrandWorkspace(ctx.user.id, input);
    await recordAuditEvent(ctx.user.id, "brand_workspace.created", "brand_workspace", workspace.id, { key: workspace.key, isDefault: workspace.isDefault });
    return workspace;
  }),

  update: protectedProcedure.input(workspacePayload.extend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { id, ...patch } = input;
    const workspace = await updateBrandWorkspace(ctx.user.id, id, patch);
    await recordAuditEvent(ctx.user.id, "brand_workspace.updated", "brand_workspace", id, { key: workspace.key });
    return workspace;
  }),

  setDefault: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const workspace = await setDefaultBrandWorkspace(ctx.user.id, input.id);
    await recordAuditEvent(ctx.user.id, "brand_workspace.default_changed", "brand_workspace", input.id, { key: workspace.key });
    return workspace;
  }),

  archive: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const workspace = await archiveBrandWorkspace(ctx.user.id, input.id);
    await recordAuditEvent(ctx.user.id, "brand_workspace.archived", "brand_workspace", input.id, { key: workspace.key });
    return workspace;
  }),

  bindPost: protectedProcedure.input(z.object({ brandWorkspaceId: z.number().int().positive(), postId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const binding = await bindPostToBrandWorkspace(ctx.user.id, input.brandWorkspaceId, input.postId);
    await recordAuditEvent(ctx.user.id, "brand_workspace.post_bound", "content_post", input.postId, { brandWorkspaceId: input.brandWorkspaceId });
    return binding;
  }),

  generateDraft: protectedProcedure.input(z.object({
    brandWorkspaceId: z.number().int().positive(),
    topicId: z.number().nullable(),
    sourceId: z.number().nullable(),
    area: z.string().min(2),
    topic: z.string().min(4),
    audience: z.string().min(2),
    format: formatSchema,
    objective: z.string().min(2),
    contentPillar: z.string().min(2),
    campaign: z.string().max(180).nullable(),
    funnelStage: z.enum(["discovery", "consideration", "conversion", "relationship"]),
    templateKey: z.string().max(60),
    legalSource: z.string().nullable(),
  })).mutation(async ({ ctx, input }) => {
    consumeRateLimit(ctx.user.id, "brandWorkspaces.generateDraft", AI_TEXT_LIMIT);
    const workspace = assertActiveWorkspace(await getBrandWorkspace(ctx.user.id, input.brandWorkspaceId));
    const generated = await generateLegalDraft({
      area: input.area,
      topic: input.topic,
      audience: input.audience,
      format: input.format,
      objective: input.objective,
      legalSource: input.legalSource,
      ...brandDraftContext(workspace),
    });
    const post = await createBrandBoundPost(ctx.user.id, workspace.id, {
      topicId: input.topicId,
      sourceId: input.sourceId,
      area: input.area,
      audience: input.audience,
      format: input.format,
      strategicObjective: input.objective,
      contentPillar: input.contentPillar,
      campaign: input.campaign,
      funnelStage: input.funnelStage,
      templateKey: input.templateKey,
      title: generated.title,
      hook: generated.hook,
      caption: generated.caption,
      cta: generated.cta,
      hashtags: generated.hashtags,
      altText: generated.altText,
      keyStatement: generated.hook,
      legalSource: input.legalSource,
      reviewDueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "draft",
    });
    await recordAuditEvent(ctx.user.id, "brand_workspace.draft_generated", "content_post", post.id, { brandWorkspaceId: workspace.id, brandKey: workspace.key });
    return post;
  }),

  createFromRadar: protectedProcedure.input(z.object({
    brandWorkspaceId: z.number().int().positive(),
    radarItemId: z.string().min(8).max(500),
  })).mutation(async ({ ctx, input }) => {
    consumeRateLimit(ctx.user.id, "brandWorkspaces.createFromRadar", AI_TEXT_LIMIT);
    const [workspace, radar] = await Promise.all([
      getBrandWorkspace(ctx.user.id, input.brandWorkspaceId).then(assertActiveWorkspace),
      fetchCurrentRadar(),
    ]);
    const item = radar.find(candidate => candidate.id === input.radarItemId);
    if (!item) throw new Error("A oportunidade não está mais disponível no Radar atual. Atualize as fontes e tente novamente.");
    if (!item.publishedAt || !item.summary || item.freshnessStatus === "expired" || item.freshnessStatus === "needs_date_verification" || new Date(item.validUntil).getTime() <= Date.now()) {
      throw new Error("Esta oportunidade precisa de validação manual de data/conteúdo antes de virar publicação.");
    }
    const source = await getOrCreateContentSource(ctx.user.id, {
      title: item.source,
      sourceType: "fonte oficial / radar",
      url: item.url,
      notes: `${item.summary}\nPublicado: ${item.publishedAt}\nConsultado: ${item.consultedAt}\nValidade editorial: ${item.validUntil}`.slice(0, 4000),
    });
    const audience = workspace.targetAudience ?? "Público institucional";
    const generated = await generateLegalDraft({
      area: item.area,
      topic: item.title,
      audience,
      format: "post",
      objective: "Atualidade e autoridade técnica",
      legalSource: item.url,
      ...brandDraftContext(workspace),
    });
    const post = await createBrandBoundPost(ctx.user.id, workspace.id, {
      topicId: null,
      sourceId: source.id,
      area: item.area,
      audience,
      format: "post",
      strategicObjective: "Atualidade e autoridade técnica",
      contentPillar: "Atualidade jurídica",
      campaign: `Radar — ${item.source}`,
      funnelStage: "discovery",
      templateKey: "noticia_comentada",
      title: generated.title,
      hook: generated.hook,
      caption: generated.caption,
      cta: generated.cta,
      hashtags: generated.hashtags,
      altText: generated.altText,
      keyStatement: generated.hook,
      legalSource: item.url,
      reviewDueAt: new Date(item.validUntil),
      status: "draft",
    });
    await recordAuditEvent(ctx.user.id, "brand_workspace.radar_draft_generated", "content_post", post.id, {
      brandWorkspaceId: workspace.id,
      radarItemId: item.id,
      source: item.source,
      publishedAt: item.publishedAt,
      consultedAt: item.consultedAt,
      validUntil: item.validUntil,
    });
    return post;
  }),

  sendToReview: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const [post, workspace, studio] = await Promise.all([
      getStudioPost(ctx.user.id, input.id),
      getPostBrandWorkspace(ctx.user.id, input.id),
      getStudioData(ctx.user.id),
    ]);
    const result = canSubmitForReview({ ...post, prohibitedTerms: workspace?.prohibitedTerms ?? studio.brand?.prohibitedTerms });
    if (!result.allowed) throw new Error(result.reason);
    const updated = await updateStudioPost(ctx.user.id, post.id, { status: "review" });
    await recordAuditEvent(ctx.user.id, "brand_workspace.sent_to_review", "content_post", post.id, { brandWorkspaceId: workspace?.id ?? null });
    return updated;
  }),

  learnings: protectedProcedure.input(z.object({ brandWorkspaceId: z.number().int().positive() })).query(({ ctx, input }) => listPerformanceLearnings(ctx.user.id, input.brandWorkspaceId)),

  learnPerformance: protectedProcedure.input(z.object({ brandWorkspaceId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const result = await learnBrandPerformance(ctx.user.id, input.brandWorkspaceId);
    await recordAuditEvent(ctx.user.id, "brand_workspace.performance_learned", "brand_workspace", input.brandWorkspaceId, { samples: result.samples, learnings: result.learnings.length, snapshot: result.snapshot });
    return result;
  }),
});
