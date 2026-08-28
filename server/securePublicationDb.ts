import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { publicationJobs } from "../drizzle/schema";
import { getDb } from "./db";
import { getInstagramConnection, getPublicationJob, type FrozenPublicationPayload } from "./socialStudioDb";

function publicationPayloadHash(payload: FrozenPublicationPayload) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export async function createSecurePublicationRequest(userId: number, payload: FrozenPublicationPayload) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const connection = await getInstagramConnection(userId);
  if (!connection) throw new Error("A conta profissional do Instagram não está conectada.");

  const idempotencyKey = publicationPayloadHash(payload);
  const [existing] = await db.select().from(publicationJobs)
    .where(and(eq(publicationJobs.userId, userId), eq(publicationJobs.idempotencyKey, idempotencyKey)))
    .limit(1);

  if (existing) {
    if (existing.status === "failed" || existing.status === "cancelled") {
      await db.update(publicationJobs).set({
        connectionId: connection.id,
        status: "pending_confirmation",
        frozenPayload: JSON.stringify(payload),
        confirmedAt: null,
        confirmedByUserId: null,
        scheduledAt: null,
        scheduleCronTaskUid: null,
        testContainerId: null,
        testedAt: null,
        containerId: null,
        mediaId: null,
        permalink: null,
        attemptCount: 0,
        lastError: null,
        publishedAt: null,
        updatedAt: new Date(),
      }).where(eq(publicationJobs.id, existing.id));
      return getPublicationJob(userId, existing.id);
    }
    return existing;
  }

  const result = await db.insert(publicationJobs).values({
    userId,
    postId: payload.postId,
    connectionId: connection.id,
    status: "pending_confirmation",
    idempotencyKey,
    frozenPayload: JSON.stringify(payload),
  });
  return getPublicationJob(userId, Number(result[0].insertId));
}
