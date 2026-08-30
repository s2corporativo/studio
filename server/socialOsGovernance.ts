import { createHash } from "node:crypto";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { automationSettings, contentPosts, publicationJobs, type ContentPost } from "../drizzle/schema";
import { postApprovalBindings, postVersions } from "../drizzle/socialOsSchema";
import { getDb } from "./db";
import { getPostMedia, getStudioPost, recordDecision, updateStudioPost } from "./socialStudioDb";

const materialFields = [
  "sourceId", "strategicObjective", "contentPillar", "campaign", "funnelStage", "templateKey",
  "title", "hook", "caption", "cta", "hashtags", "altText", "keyStatement", "legalSource", "mediaUrl",
] as const;

type EditablePatch = Partial<Pick<ContentPost, typeof materialFields[number] | "reviewDueAt">>;

type ApprovalMedia = Array<{
  id: number;
  url: string;
  mimeType: string | null;
  byteSize: number | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
}>;

export function assertPostMediaMutable(status: ContentPost["status"]) {
  if (["approved", "scheduled", "published"].includes(status)) {
    throw new Error("Mídias de conteúdo aprovado, agendado ou publicado são imutáveis. Retorne o conteúdo a rascunho antes de alterá-las.");
  }
}

function postSnapshot(post: ContentPost) {
  return {
    sourceId: post.sourceId,
    area: post.area,
    format: post.format,
    audience: post.audience,
    strategicObjective: post.strategicObjective,
    contentPillar: post.contentPillar,
    campaign: post.campaign,
    funnelStage: post.funnelStage,
    templateKey: post.templateKey,
    title: post.title,
    hook: post.hook,
    caption: post.caption,
    cta: post.cta,
    hashtags: post.hashtags,
    altText: post.altText,
    keyStatement: post.keyStatement,
    legalSource: post.legalSource,
    mediaUrl: post.mediaUrl,
  };
}

function approvalSnapshot(post: ContentPost, media: ApprovalMedia) {
  return {
    post: postSnapshot(post),
    media: media.map(item => ({
      id: item.id,
      url: item.url,
      mimeType: item.mimeType,
      byteSize: item.byteSize,
      width: item.width,
      height: item.height,
      sortOrder: item.sortOrder,
    })),
  };
}

export function hashApprovalSnapshot(post: ContentPost, media: ApprovalMedia) {
  return createHash("sha256").update(JSON.stringify(approvalSnapshot(post, media))).digest("hex");
}

async function createVersion(userId: number, post: ContentPost, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const media = await getPostMedia(userId, post.id) as ApprovalMedia;
  const [latest] = await db.select({ version: postVersions.version }).from(postVersions)
    .where(and(eq(postVersions.userId, userId), eq(postVersions.postId, post.id)))
    .orderBy(desc(postVersions.version)).limit(1);
  const version = (latest?.version ?? 0) + 1;
  const contentHash = hashApprovalSnapshot(post, media);
  const result = await db.insert(postVersions).values({
    userId,
    postId: post.id,
    version,
    contentHash,
    snapshotJson: JSON.stringify(approvalSnapshot(post, media)),
    changeReason: reason,
    createdByUserId: userId,
  });
  return { id: Number(result[0].insertId), version, contentHash };
}

export async function safeUpdatePost(userId: number, postId: number, patch: EditablePatch) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const before = await getStudioPost(userId, postId);
  if (before.status === "published") throw new Error("Conteúdo já publicado é imutável. Duplique-o para criar uma nova versão.");

  const [processingJob] = await db.select({ id: publicationJobs.id }).from(publicationJobs)
    .where(and(eq(publicationJobs.userId, userId), eq(publicationJobs.postId, postId), eq(publicationJobs.status, "processing")))
    .limit(1);
  if (processingJob) throw new Error("A publicação deste conteúdo já está em processamento. Aguarde a conclusão antes de editar.");

  const materialChange = materialFields.some(field => field in patch && patch[field] !== before[field]);
  const governancePatch: Partial<ContentPost> = { ...patch };
  if (materialChange && ["review", "approved", "scheduled"].includes(before.status)) {
    governancePatch.status = "draft";
    governancePatch.approvalOwnerId = null;
    governancePatch.approvalOwnerName = null;
    governancePatch.approvalNotes = "Aprovação anterior invalidada por alteração de conteúdo.";
    governancePatch.scheduledAt = null;
    await db.update(postApprovalBindings).set({ invalidatedAt: new Date(), invalidationReason: "Conteúdo alterado após revisão/aprovação." })
      .where(and(eq(postApprovalBindings.userId, userId), eq(postApprovalBindings.postId, postId), isNull(postApprovalBindings.invalidatedAt)));
    await db.update(publicationJobs).set({ status: "cancelled", lastError: "Cancelado automaticamente: conteúdo alterado após aprovação." })
      .where(and(eq(publicationJobs.userId, userId), eq(publicationJobs.postId, postId), inArray(publicationJobs.status, ["pending_confirmation", "queued"])));
  }

  const updated = await updateStudioPost(userId, postId, governancePatch);
  if (materialChange) await createVersion(userId, updated, before.status === "draft" ? "Conteúdo editado" : "Conteúdo editado; aprovação anterior invalidada");
  return updated;
}

export async function assertPostMediaCanChange(userId: number, postId: number) {
  const post = await getStudioPost(userId, postId);
  assertPostMediaMutable(post.status);
  return post;
}

export async function assertSelfApprovalAllowed(approverUserId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [settings] = await db.select({ allowSelfApproval: automationSettings.allowSelfApproval }).from(automationSettings)
    .where(eq(automationSettings.userId, approverUserId)).limit(1);
  if (settings && settings.allowSelfApproval === false) {
    const [latestVersion] = await db.select({ createdByUserId: postVersions.createdByUserId }).from(postVersions)
      .where(and(eq(postVersions.userId, approverUserId), eq(postVersions.postId, postId)))
      .orderBy(desc(postVersions.version)).limit(1);
    const authorUserId = latestVersion?.createdByUserId ?? approverUserId;
    if (authorUserId === approverUserId) {
      throw new Error("A trava de dupla revisão está ativa: quem produziu a versão não pode aprová-la. Peça a aprovação de um segundo revisor ou desative a trava na Central de Automação.");
    }
  }
}

export async function bindApproval(userId: number, postId: number, reviewerName: string, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const post = await getStudioPost(userId, postId);
  const version = await createVersion(userId, post, "Versão submetida à aprovação");
  await db.update(postApprovalBindings).set({ invalidatedAt: new Date(), invalidationReason: "Substituída por aprovação de nova versão." })
    .where(and(eq(postApprovalBindings.userId, userId), eq(postApprovalBindings.postId, postId), isNull(postApprovalBindings.invalidatedAt)));
  await db.insert(postApprovalBindings).values({
    userId,
    postId,
    versionId: version.id,
    contentHash: version.contentHash,
    approvedByUserId: userId,
  });
  return recordDecision(userId, postId, reviewerName, "approved", notes);
}

export async function rejectOrRequestChanges(userId: number, postId: number, reviewerName: string, decision: "rejected" | "changes_requested", notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.update(postApprovalBindings).set({ invalidatedAt: new Date(), invalidationReason: decision === "rejected" ? "Conteúdo rejeitado." : "Alterações solicitadas." })
    .where(and(eq(postApprovalBindings.userId, userId), eq(postApprovalBindings.postId, postId), isNull(postApprovalBindings.invalidatedAt)));
  return recordDecision(userId, postId, reviewerName, decision, notes);
}

export async function assertApprovalStillValid(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [post, media] = await Promise.all([getStudioPost(userId, postId), getPostMedia(userId, postId)]);
  const [binding] = await db.select().from(postApprovalBindings)
    .where(and(eq(postApprovalBindings.userId, userId), eq(postApprovalBindings.postId, postId), isNull(postApprovalBindings.invalidatedAt)))
    .orderBy(desc(postApprovalBindings.approvedAt)).limit(1);
  if (!binding) throw new Error("Não existe aprovação válida para a versão atual.");
  const currentHash = hashApprovalSnapshot(post, media as ApprovalMedia);
  if (binding.contentHash !== currentHash) throw new Error("O texto ou a mídia mudou após a aprovação. Uma nova aprovação é obrigatória.");
  return binding;
}
