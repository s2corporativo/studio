import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { approvalReadiness, canSchedule } from "../studioRules";
import { getInstagramConnection, getPostMedia, getStudioData, getStudioPost, recordPublicationAttempt, updateStudioPost, type FrozenPublicationPayload } from "../socialStudioDb";
import { assertApprovalStillValid, assertSelfApprovalAllowed, bindApproval, rejectOrRequestChanges, safeUpdatePost } from "../socialOsGovernance";
import { recordAuditEvent } from "../socialOsDb";
import { createSecurePublicationRequest } from "../securePublicationDb";
import { buildInstagramCaption, preflightInstagramPublication } from "../instagramRules";
import { getInstagramOAuthOrigin } from "../instagramOrigins";
import { isInstagramMetaConfigured } from "../instagramApi";

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
      await assertSelfApprovalAllowed(ctx.user.id, input.id);
      const [post, { brand }] = await Promise.all([getStudioPost(ctx.user.id, input.id), getStudioData(ctx.user.id)]);
      const result = approvalReadiness({ ...post, approvalOwnerName: reviewerName, prohibitedTerms: brand?.prohibitedTerms });
      if (!result.ready) throw new Error(`Aprovação bloqueada: inclua ${result.missing.join(", ")}.`);
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

  requestInstagramPublication: protectedProcedure.input(z.object({ postId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const binding = await assertApprovalStillValid(ctx.user.id, input.postId);
    const [post, media, connection, { brand }] = await Promise.all([
      getStudioPost(ctx.user.id, input.postId),
      getPostMedia(ctx.user.id, input.postId),
      getInstagramConnection(ctx.user.id),
      getStudioData(ctx.user.id),
    ]);
    const publicOrigin = getInstagramOAuthOrigin(ctx.req);
    const preflight = preflightInstagramPublication({ post, media, connection, metaConfigured: isInstagramMetaConfigured(), origin: publicOrigin, prohibitedTerms: brand?.prohibitedTerms });
    if (!preflight.allowed) throw new Error(`Publicação bloqueada: ${preflight.issues.join("; ")}.`);
    const payload: FrozenPublicationPayload = {
      postId: post.id,
      title: post.title,
      format: post.format as "post" | "carousel",
      caption: buildInstagramCaption(post),
      altText: post.altText,
      media: media.map(item => ({ id: item.id, url: new URL(item.url, publicOrigin).toString(), mimeType: item.mimeType, byteSize: item.byteSize, width: item.width, height: item.height })),
      approvedAt: binding.approvedAt.toISOString(),
    };
    const job = await createSecurePublicationRequest(ctx.user.id, payload);
    await recordPublicationAttempt(job.id, { stage: "preflight", outcome: "succeeded", detail: "Pré-publicação validada contra a versão e mídias aprovadas; aguardando confirmação humana explícita." });
    await recordAuditEvent(ctx.user.id, "instagram.preflight_with_immutable_approval", "publication_job", job.id, { postId: post.id });
    return job;
  }),
});
