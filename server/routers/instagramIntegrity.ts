import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { publicationJobs } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { isInstagramMetaConfigured } from "../instagramApi";
import { getInstagramOAuthOrigin } from "../instagramOrigins";
import { buildInstagramCaption, preflightInstagramPublication } from "../instagramRules";
import { assertApprovalStillValid } from "../socialOsGovernance";
import { recordAuditEvent } from "../socialOsDb";
import { getInstagramConnection, getPostMedia, getStudioData, getStudioPost, recordPublicationAttempt } from "../socialStudioDb";

function payloadHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export const instagramIntegrityRouter = router({
  requestPublication: protectedProcedure.input(z.object({ postId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const [post, media, connection, studio, approval] = await Promise.all([
      getStudioPost(ctx.user.id, input.postId),
      getPostMedia(ctx.user.id, input.postId),
      getInstagramConnection(ctx.user.id),
      getStudioData(ctx.user.id),
      assertApprovalStillValid(ctx.user.id, input.postId),
    ]);
    const publicOrigin = getInstagramOAuthOrigin(ctx.req);
    const preflight = preflightInstagramPublication({ post, media, connection, metaConfigured: isInstagramMetaConfigured(), origin: publicOrigin, prohibitedTerms: studio.brand?.prohibitedTerms });
    if (!preflight.allowed) throw new Error(`Publicação bloqueada: ${preflight.issues.join("; ")}.`);
    if (!connection) throw new Error("A conta profissional do Instagram não está conectada.");

    const frozenPayload = {
      postId: post.id,
      title: post.title,
      format: post.format as "post" | "carousel",
      caption: buildInstagramCaption(post),
      altText: post.altText,
      media: media.map(item => ({
        id: item.id,
        url: new URL(item.url, publicOrigin).toString(),
        mimeType: item.mimeType,
        byteSize: item.byteSize,
        width: item.width,
        height: item.height,
        sortOrder: item.sortOrder,
      })),
      approvalHash: approval.contentHash,
      approvalVersionId: approval.versionId,
      approvedAt: approval.approvedAt.toISOString(),
    };
    const idempotencyKey = payloadHash(frozenPayload);
    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível.");
    const [existing] = await db.select().from(publicationJobs).where(and(eq(publicationJobs.userId, ctx.user.id), eq(publicationJobs.idempotencyKey, idempotencyKey))).limit(1);
    if (existing && !["failed", "cancelled"].includes(existing.status)) return existing;

    let jobId: number;
    if (existing) {
      jobId = existing.id;
      await db.update(publicationJobs).set({
        connectionId: connection.id,
        frozenPayload: JSON.stringify(frozenPayload),
        status: "pending_confirmation",
        confirmedAt: null,
        confirmedByUserId: null,
        scheduledAt: null,
        scheduleCronTaskUid: null,
        testContainerId: null,
        testedAt: null,
        containerId: null,
        mediaId: null,
        permalink: null,
        lastError: null,
        updatedAt: new Date(),
      }).where(eq(publicationJobs.id, existing.id));
    } else {
      const result = await db.insert(publicationJobs).values({
        userId: ctx.user.id,
        postId: post.id,
        connectionId: connection.id,
        status: "pending_confirmation",
        idempotencyKey,
        frozenPayload: JSON.stringify(frozenPayload),
      });
      jobId = Number(result[0].insertId);
    }
    const [job] = await db.select().from(publicationJobs).where(eq(publicationJobs.id, jobId)).limit(1);
    if (!job) throw new Error("Não foi possível criar a solicitação de publicação.");
    await recordPublicationAttempt(job.id, { stage: "preflight", outcome: "succeeded", detail: `Payload congelado pela versão aprovada ${approval.versionId}; aguardando confirmação humana.` });
    await recordAuditEvent(ctx.user.id, "instagram.publication_payload_frozen", "publication_job", job.id, { postId: post.id, approvalHash: approval.contentHash, idempotencyKey });
    return job;
  }),
});
