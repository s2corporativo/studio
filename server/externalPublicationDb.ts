import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { externalPublicationJobs } from "../drizzle/externalConnectionsSchema";
import { getDb } from "./db";

export async function listExternalPublicationJobs(userId: number, provider: "facebook", limit = 20) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  return db.select({
    id: externalPublicationJobs.id,
    provider: externalPublicationJobs.provider,
    externalConnectionId: externalPublicationJobs.externalConnectionId,
    postId: externalPublicationJobs.postId,
    approvalHash: externalPublicationJobs.approvalHash,
    status: externalPublicationJobs.status,
    attemptCount: externalPublicationJobs.attemptCount,
    externalPostId: externalPublicationJobs.externalPostId,
    lastError: externalPublicationJobs.lastError,
    confirmedAt: externalPublicationJobs.confirmedAt,
    publishedAt: externalPublicationJobs.publishedAt,
    createdAt: externalPublicationJobs.createdAt,
  }).from(externalPublicationJobs).where(and(eq(externalPublicationJobs.userId, userId), eq(externalPublicationJobs.provider, provider))).orderBy(desc(externalPublicationJobs.createdAt)).limit(Math.max(1, Math.min(limit, 100)));
}

export async function getExternalPublicationJob(userId: number, jobId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [job] = await db.select().from(externalPublicationJobs).where(and(eq(externalPublicationJobs.id, jobId), eq(externalPublicationJobs.userId, userId))).limit(1);
  if (!job) throw new Error("Job de publicação externa não encontrado.");
  return job;
}

export async function getOrCreateExternalPublicationJob(values: Omit<typeof externalPublicationJobs.$inferInsert, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.insert(externalPublicationJobs).values(values).onDuplicateKeyUpdate({ set: { idempotencyKey: values.idempotencyKey } });
  const [job] = await db.select().from(externalPublicationJobs).where(eq(externalPublicationJobs.idempotencyKey, values.idempotencyKey)).limit(1);
  if (!job) throw new Error("Não foi possível criar o job de publicação externa.");
  return job;
}

export async function claimExternalPublicationJob(userId: number, jobId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const result = await db.update(externalPublicationJobs).set({
    status: "processing",
    confirmedByUserId: userId,
    confirmedAt: new Date(),
    attemptCount: sql`${externalPublicationJobs.attemptCount} + 1`,
    lastError: null,
    updatedAt: new Date(),
  }).where(and(
    eq(externalPublicationJobs.id, jobId),
    eq(externalPublicationJobs.userId, userId),
    inArray(externalPublicationJobs.status, ["pending_confirmation", "failed"]),
  ));
  return Number((result as any)?.[0]?.affectedRows ?? 0) === 1;
}

export async function completeExternalPublicationJob(userId: number, jobId: number, externalPostId: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.update(externalPublicationJobs).set({ status: "published", externalPostId, publishedAt: new Date(), lastError: null, updatedAt: new Date() }).where(and(eq(externalPublicationJobs.id, jobId), eq(externalPublicationJobs.userId, userId), eq(externalPublicationJobs.status, "processing")));
  return getExternalPublicationJob(userId, jobId);
}

export async function failExternalPublicationJob(userId: number, jobId: number, message: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.update(externalPublicationJobs).set({ status: "failed", lastError: message.slice(0, 2000), updatedAt: new Date() }).where(and(eq(externalPublicationJobs.id, jobId), eq(externalPublicationJobs.userId, userId), eq(externalPublicationJobs.status, "processing")));
  return getExternalPublicationJob(userId, jobId);
}

export async function quarantineExternalPublicationJob(userId: number, jobId: number, message: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.update(externalPublicationJobs).set({ status: "unknown_outcome", lastError: message.slice(0, 2000), updatedAt: new Date() }).where(and(eq(externalPublicationJobs.id, jobId), eq(externalPublicationJobs.userId, userId), eq(externalPublicationJobs.status, "processing")));
  return getExternalPublicationJob(userId, jobId);
}
