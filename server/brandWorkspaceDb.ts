import { createHash } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { brandContentBindings, brandMemorySnapshots, brandWorkspaces, performanceLearnings } from "../drizzle/brandWorkspaceSchema";
import { contentPosts } from "../drizzle/schema";
import { getDb } from "./db";

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  return db;
}

export async function listBrandWorkspaces(userId: number) {
  const db = await dbOrThrow();
  return db.select().from(brandWorkspaces).where(eq(brandWorkspaces.userId, userId)).orderBy(desc(brandWorkspaces.isDefault), desc(brandWorkspaces.updatedAt));
}

export async function getBrandWorkspace(userId: number, id: number) {
  const db = await dbOrThrow();
  const [row] = await db.select().from(brandWorkspaces).where(and(eq(brandWorkspaces.userId, userId), eq(brandWorkspaces.id, id))).limit(1);
  if (!row) throw new Error("Marca não encontrada.");
  return row;
}

export async function createBrandWorkspace(userId: number, input: Omit<typeof brandWorkspaces.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt" | "status" | "isDefault">) {
  const db = await dbOrThrow();
  return db.transaction(async tx => {
    const existing = await tx.select({ id: brandWorkspaces.id }).from(brandWorkspaces).where(and(eq(brandWorkspaces.userId, userId), eq(brandWorkspaces.status, "active"))).limit(1);
    const result = await tx.insert(brandWorkspaces).values({ ...input, userId, status: "active", isDefault: existing.length === 0 });
    const id = Number(result[0].insertId);
    const [row] = await tx.select().from(brandWorkspaces).where(and(eq(brandWorkspaces.userId, userId), eq(brandWorkspaces.id, id))).limit(1);
    if (!row) throw new Error("Falha ao criar a marca.");
    return row;
  });
}

export async function updateBrandWorkspace(userId: number, id: number, patch: Partial<Pick<typeof brandWorkspaces.$inferInsert, "name" | "segment" | "location" | "targetAudience" | "commercialGoal" | "toneOfVoice" | "primaryCta" | "prohibitedTerms" | "visualGuidelines" | "websiteUrl" | "whatsapp">>) {
  const db = await dbOrThrow();
  await getBrandWorkspace(userId, id);
  await db.update(brandWorkspaces).set({ ...patch, updatedAt: new Date() }).where(and(eq(brandWorkspaces.userId, userId), eq(brandWorkspaces.id, id)));
  return getBrandWorkspace(userId, id);
}

export async function setDefaultBrandWorkspace(userId: number, id: number) {
  const db = await dbOrThrow();
  const target = await getBrandWorkspace(userId, id);
  if (target.status !== "active") throw new Error("Uma marca arquivada não pode ser definida como padrão.");
  await db.transaction(async tx => {
    await tx.update(brandWorkspaces).set({ isDefault: false, updatedAt: new Date() }).where(eq(brandWorkspaces.userId, userId));
    await tx.update(brandWorkspaces).set({ isDefault: true, updatedAt: new Date() }).where(and(eq(brandWorkspaces.userId, userId), eq(brandWorkspaces.id, id)));
  });
  return getBrandWorkspace(userId, id);
}

export async function archiveBrandWorkspace(userId: number, id: number) {
  const workspace = await getBrandWorkspace(userId, id);
  if (workspace.isDefault) throw new Error("Defina outra marca como padrão antes de arquivar esta marca.");
  const db = await dbOrThrow();
  await db.update(brandWorkspaces).set({ status: "archived", updatedAt: new Date() }).where(and(eq(brandWorkspaces.userId, userId), eq(brandWorkspaces.id, id)));
  return getBrandWorkspace(userId, id);
}

export async function bindPostToBrandWorkspace(userId: number, brandWorkspaceId: number, postId: number) {
  const db = await dbOrThrow();
  await getBrandWorkspace(userId, brandWorkspaceId);
  const [post] = await db.select({ id: contentPosts.id }).from(contentPosts).where(and(eq(contentPosts.userId, userId), eq(contentPosts.id, postId))).limit(1);
  if (!post) throw new Error("Conteúdo não encontrado.");
  await db.insert(brandContentBindings).values({ userId, brandWorkspaceId, postId }).onDuplicateKeyUpdate({ set: { brandWorkspaceId } });
  const [binding] = await db.select().from(brandContentBindings).where(and(eq(brandContentBindings.userId, userId), eq(brandContentBindings.postId, postId))).limit(1);
  return binding;
}

export async function listWorkspacePostIds(userId: number, brandWorkspaceId: number) {
  const db = await dbOrThrow();
  await getBrandWorkspace(userId, brandWorkspaceId);
  const rows = await db.select({ postId: brandContentBindings.postId }).from(brandContentBindings).where(and(eq(brandContentBindings.userId, userId), eq(brandContentBindings.brandWorkspaceId, brandWorkspaceId)));
  return rows.map(row => row.postId);
}

export async function listPerformanceLearnings(userId: number, brandWorkspaceId: number) {
  const db = await dbOrThrow();
  await getBrandWorkspace(userId, brandWorkspaceId);
  return db.select().from(performanceLearnings).where(and(eq(performanceLearnings.userId, userId), eq(performanceLearnings.brandWorkspaceId, brandWorkspaceId), eq(performanceLearnings.active, true))).orderBy(desc(performanceLearnings.confidenceScore), desc(performanceLearnings.updatedAt));
}

export async function upsertPerformanceLearning(userId: number, brandWorkspaceId: number, value: Omit<typeof performanceLearnings.$inferInsert, "id" | "userId" | "brandWorkspaceId" | "createdAt" | "updatedAt">) {
  const db = await dbOrThrow();
  await db.insert(performanceLearnings).values({ ...value, userId, brandWorkspaceId }).onDuplicateKeyUpdate({
    set: {
      sampleSize: value.sampleSize,
      evidenceJson: value.evidenceJson,
      recommendation: value.recommendation,
      confidenceScore: value.confidenceScore,
      active: value.active,
      updatedAt: new Date(),
    },
  });
}

function canonicalJson(value: unknown) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export async function createBrandMemorySnapshot(userId: number, brandWorkspaceId: number, memory: unknown, source = "system") {
  const db = await dbOrThrow();
  await getBrandWorkspace(userId, brandWorkspaceId);
  const memoryJson = canonicalJson(memory);
  const contentHash = createHash("sha256").update(memoryJson).digest("hex");
  return db.transaction(async tx => {
    const [latest] = await tx.select({ version: brandMemorySnapshots.version, contentHash: brandMemorySnapshots.contentHash, id: brandMemorySnapshots.id }).from(brandMemorySnapshots)
      .where(and(eq(brandMemorySnapshots.userId, userId), eq(brandMemorySnapshots.brandWorkspaceId, brandWorkspaceId)))
      .orderBy(desc(brandMemorySnapshots.version)).limit(1);
    if (latest?.contentHash === contentHash) return { id: latest.id, version: latest.version, contentHash, created: false };
    const nextVersion = (latest?.version ?? 0) + 1;
    await tx.update(brandMemorySnapshots).set({ active: false }).where(and(eq(brandMemorySnapshots.userId, userId), eq(brandMemorySnapshots.brandWorkspaceId, brandWorkspaceId), eq(brandMemorySnapshots.active, true)));
    const result = await tx.insert(brandMemorySnapshots).values({ userId, brandWorkspaceId, version: nextVersion, contentHash, memoryJson, source, active: true });
    return { id: Number(result[0].insertId), version: nextVersion, contentHash, created: true };
  });
}
