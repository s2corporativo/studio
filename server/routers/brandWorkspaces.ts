import { z } from "zod";
import { editorialFormats } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { AI_TEXT_LIMIT, consumeRateLimit } from "../_core/rateLimit";
import { archiveBrandWorkspace, bindPostToBrandWorkspace, createBrandWorkspace, getBrandWorkspace, listBrandWorkspaces, listPerformanceLearnings, setDefaultBrandWorkspace, updateBrandWorkspace } from "../brandWorkspaceDb";
import { createBrandBoundPost } from "../brandWorkspaceContentDb";
import { learnBrandPerformance } from "../performanceLearningEngine";
import { recordAuditEvent } from "../socialOsDb";
import { generateLegalDraft } from "../socialStudioGenerator";

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
    const workspace = await getBrandWorkspace(ctx.user.id, input.brandWorkspaceId);
    if (workspace.status !== "active") throw new Error("A marca selecionada não está ativa.");
    const generated = await generateLegalDraft({
      area: input.area,
      topic: input.topic,
      audience: input.audience || workspace.targetAudience || "Público institucional",
      format: input.format,
      objective: input.objective,
      legalSource: input.legalSource,
      primaryCta: workspace.primaryCta,
      toneOfVoice: workspace.toneOfVoice,
      prohibitedTerms: workspace.prohibitedTerms,
    });
    const post = await createBrandBoundPost(ctx.user.id, workspace.id, {
      topicId: input.topicId,
      sourceId: input.sourceId,
      area: input.area,
      audience: input.audience || workspace.targetAudience || "Público institucional",
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

  learnings: protectedProcedure.input(z.object({ brandWorkspaceId: z.number().int().positive() })).query(({ ctx, input }) => listPerformanceLearnings(ctx.user.id, input.brandWorkspaceId)),

  learnPerformance: protectedProcedure.input(z.object({ brandWorkspaceId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const result = await learnBrandPerformance(ctx.user.id, input.brandWorkspaceId);
    await recordAuditEvent(ctx.user.id, "brand_workspace.performance_learned", "brand_workspace", input.brandWorkspaceId, { samples: result.samples, learnings: result.learnings.length, snapshot: result.snapshot });
    return result;
  }),
});
