import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { approvalReadiness, canSchedule } from "../studioRules";
import { getStudioData, getStudioPost, updateStudioPost } from "../socialStudioDb";
import { assertApprovalStillValid, bindApproval, rejectOrRequestChanges, safeUpdatePost } from "../socialOsGovernance";
import { recordAuditEvent } from "../socialOsDb";

export const socialGovernanceRouter = router({
  updatePost: protectedProcedure.input(z.object({
    id: z.number().int().positive(),
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
    mediaUrl: z.string().refine(value => value.startsWith("/manus-storage/") || /^https:\/\//.test(value), "Informe uma URL HTTPS pública ou mídia armazenada pelo sistema.").nullable(),
  })).mutation(async ({ ctx, input }) => {
    const { id, ...patch } = input;
    const post = await safeUpdatePost(ctx.user.id, id, patch);
    await recordAuditEvent(ctx.user.id, "post.updated_safely", "content_post", id, { status: post.status });
    return post;
  }),

  decide: protectedProcedure.input(z.object({
    id: z.number().int().positive(),
    decision: z.enum(["approved", "rejected", "changes_requested"]),
    notes: z.string().max(3000).optional(),
  })).mutation(async ({ ctx, input }) => {
    const reviewerName = ctx.user.name ?? "Responsável";
    if (input.decision === "approved") {
      const [post, { brand }] = await Promise.all([getStudioPost(ctx.user.id, input.id), getStudioData(ctx.user.id)]);
      const result = approvalReadiness({ ...post, approvalOwnerName: reviewerName, prohibitedTerms: brand?.prohibitedTerms });
      if (!result.allowed) throw new Error(result.reason);
      const approved = await bindApproval(ctx.user.id, input.id, reviewerName, input.notes);
      await recordAuditEvent(ctx.user.id, "post.version_approved", "content_post", input.id);
      return approved;
    }
    const decided = await rejectOrRequestChanges(ctx.user.id, input.id, reviewerName, input.decision, input.notes);
    await recordAuditEvent(ctx.user.id, `post.${input.decision}`, "content_post", input.id);
    return decided;
  }),

  schedule: protectedProcedure.input(z.object({ id: z.number().int().positive(), scheduledAt: z.date() })).mutation(async ({ ctx, input }) => {
    const post = await getStudioPost(ctx.user.id, input.id);
    const scheduleCheck = canSchedule(post.status, input.scheduledAt);
    if (!scheduleCheck.allowed) throw new Error(scheduleCheck.reason);
    await assertApprovalStillValid(ctx.user.id, post.id);
    const scheduled = await updateStudioPost(ctx.user.id, post.id, { status: "scheduled", scheduledAt: input.scheduledAt });
    await recordAuditEvent(ctx.user.id, "post.scheduled_with_valid_approval", "content_post", post.id, { scheduledAt: input.scheduledAt.toISOString() });
    return scheduled;
  }),
});
