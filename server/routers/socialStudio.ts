import { z } from "zod";
import { contentStatuses, editorialFormats } from "../../drizzle/schema";
import { approvalReadiness, canSchedule, canSubmitForReview } from "../studioRules";
import { generateLegalDraft } from "../socialStudioGenerator";
import { createContentSource, createKnowledgeMaterial, createStudioPost, getStudioData, getStudioPost, recordDecision, updateBrandProfile, updateStudioPost } from "../socialStudioDb";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";

const statusSchema = z.enum(contentStatuses);
const formatSchema = z.enum(editorialFormats);

export const socialStudioRouter = router({
  data: protectedProcedure.query(({ ctx }) => getStudioData(ctx.user.id)),
  generateDraft: protectedProcedure.input(z.object({
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
    const { brand } = await getStudioData(ctx.user.id);
    const generated = await generateLegalDraft({
      ...input,
      primaryCta: brand?.primaryCta,
      toneOfVoice: brand?.toneOfVoice,
      prohibitedTerms: brand?.prohibitedTerms,
    });
    return createStudioPost(ctx.user.id, {
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
  }),
  updatePost: protectedProcedure.input(z.object({
    id: z.number(),
    sourceId: z.number().nullable(),
    strategicObjective: z.string().max(2000).nullable(),
    contentPillar: z.string().max(80).nullable(),
    campaign: z.string().max(180).nullable(),
    funnelStage: z.enum(["discovery", "consideration", "conversion", "relationship"]).nullable(),
    templateKey: z.string().max(60).nullable(),
    title: z.string().min(4),
    hook: z.string().nullable(),
    caption: z.string().nullable(),
    cta: z.string().nullable(),
    hashtags: z.string().nullable(),
    keyStatement: z.string().nullable(),
    legalSource: z.string().nullable(),
    reviewDueAt: z.date().nullable(),
    mediaUrl: z.string().url().nullable(),
  })).mutation(({ ctx, input }) => {
    const { id, ...patch } = input;
    return updateStudioPost(ctx.user.id, id, patch);
  }),
  sendToReview: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const post = await getStudioPost(ctx.user.id, input.id);
    const result = canSubmitForReview(post);
    if (!result.allowed) throw new Error(result.reason);
    return updateStudioPost(ctx.user.id, post.id, { status: "review" });
  }),
  decide: protectedProcedure.input(z.object({
    id: z.number(),
    decision: z.enum(["approved", "rejected", "changes_requested"]),
    notes: z.string().max(3000).optional(),
  })).mutation(async ({ ctx, input }) => {
    const post = await getStudioPost(ctx.user.id, input.id);
    if (input.decision === "approved") {
      const result = approvalReadiness({ ...post, approvalOwnerName: ctx.user.name ?? "Responsável" });
      if (!result.ready) throw new Error(`Aprovação bloqueada: inclua ${result.missing.join(", ")}.`);
    }
    return recordDecision(ctx.user.id, post.id, ctx.user.name ?? "Responsável", input.decision, input.notes);
  }),
  schedule: protectedProcedure.input(z.object({ id: z.number(), scheduledAt: z.date() })).mutation(async ({ ctx, input }) => {
    const post = await getStudioPost(ctx.user.id, input.id);
    const result = canSchedule(post.status, input.scheduledAt);
    if (!result.allowed) throw new Error(result.reason);
    return updateStudioPost(ctx.user.id, post.id, { status: "scheduled", scheduledAt: input.scheduledAt });
  }),
  updateBrand: protectedProcedure.input(z.object({
    brandName: z.string().min(3), segment: z.string().min(3), location: z.string().nullable(),
    targetAudience: z.string().nullable(), commercialGoal: z.string().nullable(), toneOfVoice: z.string().nullable(),
    primaryCta: z.string().nullable(), prohibitedTerms: z.string().nullable(), websiteUrl: z.string().url().nullable(),
    whatsapp: z.string().nullable(), visualGuidelines: z.string().nullable(), operationMode: z.enum(["manual", "semi_automatic"]),
  })).mutation(({ ctx, input }) => updateBrandProfile(ctx.user.id, input)),
  addSource: protectedProcedure.input(z.object({
    title: z.string().min(3),
    sourceType: z.string().min(2),
    url: z.string().url().nullable(),
    notes: z.string().nullable(),
    verifiedAt: z.date().nullable(),
  })).mutation(({ ctx, input }) => createContentSource(ctx.user.id, input)),
  addKnowledge: protectedProcedure.input(z.object({
    title: z.string().min(3),
    materialType: z.string().min(2),
    url: z.string().url().nullable(),
    notes: z.string().nullable(),
    isVerified: z.boolean(),
  })).mutation(({ ctx, input }) => createKnowledgeMaterial(ctx.user.id, input)),
  uploadKnowledge: protectedProcedure.input(z.object({
    title: z.string().min(3).max(255),
    materialType: z.string().min(2).max(60),
    mimeType: z.string().min(3).max(120),
    base64: z.string().min(8).max(8_000_000),
    notes: z.string().nullable(),
    isVerified: z.boolean(),
  })).mutation(async ({ ctx, input }) => {
    const bytes = Buffer.from(input.base64, "base64");
    if (bytes.byteLength > 5 * 1024 * 1024) throw new Error("O arquivo deve ter até 5 MB.");
    const safeName = input.title.toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "material";
    const extension = input.mimeType.includes("pdf") ? ".pdf" : input.mimeType.startsWith("image/") ? `.${input.mimeType.split("/")[1]}` : ".bin";
    const stored = await storagePut(`social-studio/${ctx.user.id}/conhecimento/${safeName}${extension}`, bytes, input.mimeType);
    return createKnowledgeMaterial(ctx.user.id, { title: input.title, materialType: input.materialType, url: stored.url, storageKey: stored.key, mimeType: input.mimeType, notes: input.notes, isVerified: input.isVerified });
  }),
});
