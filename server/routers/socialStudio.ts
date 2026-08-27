import { z } from "zod";
import { contentStatuses, editorialFormats } from "../../drizzle/schema";
import { approvalReadiness, canSchedule, canSubmitForReview } from "../studioRules";
import { generateLegalDraft } from "../socialStudioGenerator";
import { createContentSource, createStudioPost, getStudioData, getStudioPost, recordDecision, updateBrandProfile, updateStudioPost } from "../socialStudioDb";
import { protectedProcedure, router } from "../_core/trpc";

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
});
