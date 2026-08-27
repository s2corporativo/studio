import { and, asc, desc, eq } from "drizzle-orm";
import {
  approvalLogs,
  brandProfiles,
  contentMedia,
  contentPosts,
  contentSources,
  editorialTopics,
  instagramConnections,
  knowledgeMaterials,
  publicationAttempts,
  publicationJobs,
  type ContentPost,
  type ContentStatus,
} from "../drizzle/schema";
import { getDb } from "./db";

const defaultTopics = [
  ["Consumidor", "Cobrança indevida: o que precisa ser provado", "Pessoas físicas", "alta", "carousel", "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm"],
  ["Trabalhista", "Rescisão: documentos que o trabalhador deve conferir", "Trabalhadores", "alta", "carousel", "https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm"],
  ["Trabalhista Empresarial", "Controle de jornada: falhas que geram passivo", "Empresas, RH e gestores", "alta", "carousel", "https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm"],
  ["Tributário", "Reforma Tributária: o que revisar primeiro", "Empresas", "alta", "post", "https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/reforma-tributaria-do-consumo"],
  ["Ambiental", "Licenciamento: o que verificar antes de operar", "Empresas e produtores", "alta", "carousel", "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15190.htm"],
  ["Penal", "Intimação policial: preserve direitos e documentos", "Pessoas físicas e empresas", "média", "post", "https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm"],
  ["Juizado Especial", "Dano moral não é qualquer aborrecimento", "Consumidores", "alta", "post", "https://www.planalto.gov.br/ccivil_03/leis/l9099.htm"],
  ["LGPD", "Dados de empregados: cinco pontos de controle", "Empresas e RH", "alta", "carousel", "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2018/lei/l13709.htm"],
  ["Compliance", "Assédio: política que sai do papel", "Empresas e lideranças", "alta", "carousel", "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/l14457.htm"],
] as const;

export async function ensureStudioDefaults(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");

  const existingBrand = await db.select().from(brandProfiles).where(eq(brandProfiles.userId, userId)).limit(1);
  if (existingBrand.length === 0) {
    await db.insert(brandProfiles).values({
      userId,
      brandName: "De Paula Teixeira Advocacia",
      segment: "Advocacia consultiva e contenciosa",
      location: "Betim/MG",
      targetAudience: "Pessoas físicas, empresas, gestores e produtores que demandam orientação jurídica preventiva e técnica.",
      commercialGoal: "Consolidar autoridade institucional e gerar conversas qualificadas.",
      toneOfVoice: "Técnico, humano, preventivo, claro e sóbrio. Sem promessas de resultado.",
      primaryCta: "Conheça nossas áreas e canais oficiais de contato.",
      prohibitedTerms: "Garantido, causa ganha, resultado certo, urgente sem contexto, promoção de serviços jurídicos.",
      operationMode: "manual",
      websiteUrl: "https://depaulateixeira.adv.br",
      visualGuidelines: "Verde-carvão, bronze, marfim, tipografia editorial, respiro e logo discreta no rodapé.",
    });
  }

  const existingTopics = await db.select({ id: editorialTopics.id }).from(editorialTopics).where(eq(editorialTopics.userId, userId)).limit(1);
  if (existingTopics.length === 0) {
    await db.insert(editorialTopics).values(defaultTopics.map(([area, title, audience, priority, format, sourceUrl]) => ({
      userId,
      area,
      title,
      description: "Tema prioritário da biblioteca inicial do escritório.",
      audience,
      priority,
      suggestedFormat: format,
      sourceUrl,
      tags: `${area.toLowerCase()}, conteúdo informativo, revisão jurídica`,
    })));
  }

  const existingSource = await db.select({ id: contentSources.id }).from(contentSources).where(eq(contentSources.userId, userId)).limit(1);
  if (existingSource.length === 0) {
    await db.insert(contentSources).values({
      userId,
      title: "Site institucional do escritório",
      sourceType: "site",
      url: "https://depaulateixeira.adv.br",
      notes: "Fonte institucional de posicionamento, áreas de atuação e canais de contato.",
      verifiedAt: new Date(),
    });
  }

  const existingKnowledge = await db.select({ id: knowledgeMaterials.id }).from(knowledgeMaterials).where(eq(knowledgeMaterials.userId, userId)).limit(1);
  if (existingKnowledge.length === 0) {
    await db.insert(knowledgeMaterials).values({
      userId,
      title: "Site institucional da De Paula Teixeira Advocacia",
      materialType: "site institucional",
      url: "https://depaulateixeira.adv.br",
      notes: "Referência prioritária para áreas de atuação, tom e canais oficiais.",
      isVerified: true,
    });
  }
}

export async function getStudioData(userId: number) {
  await ensureStudioDefaults(userId);
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [brand] = await db.select().from(brandProfiles).where(eq(brandProfiles.userId, userId)).limit(1);
  const topics = await db.select().from(editorialTopics).where(eq(editorialTopics.userId, userId)).orderBy(desc(editorialTopics.createdAt));
  const posts = await db.select().from(contentPosts).where(eq(contentPosts.userId, userId)).orderBy(desc(contentPosts.updatedAt));
  const media = await db.select().from(contentMedia).where(eq(contentMedia.userId, userId)).orderBy(asc(contentMedia.postId), asc(contentMedia.sortOrder));
  const sources = await db.select().from(contentSources).where(eq(contentSources.userId, userId)).orderBy(desc(contentSources.verifiedAt));
  const knowledge = await db.select().from(knowledgeMaterials).where(eq(knowledgeMaterials.userId, userId)).orderBy(desc(knowledgeMaterials.createdAt));
  const usageByTopic = posts.reduce<Record<number, number>>((acc, post) => {
    if (post.topicId) acc[post.topicId] = (acc[post.topicId] ?? 0) + 1;
    return acc;
  }, {});
  const topTopics = topics
    .map(topic => ({ ...topic, usageCount: usageByTopic[topic.id] ?? 0 }))
    .sort((a, b) => b.usageCount - a.usageCount || a.title.localeCompare(b.title, "pt-BR"))
    .slice(0, 6);
  return { brand, topics, posts, media, sources, knowledge, topTopics };
}

export async function createStudioPost(userId: number, values: Omit<typeof contentPosts.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const result = await db.insert(contentPosts).values({ ...values, userId });
  const [post] = await db.select().from(contentPosts).where(and(eq(contentPosts.id, Number(result[0].insertId)), eq(contentPosts.userId, userId))).limit(1);
  return post;
}

export async function getStudioPost(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [post] = await db.select().from(contentPosts).where(and(eq(contentPosts.id, postId), eq(contentPosts.userId, userId))).limit(1);
  if (!post) throw new Error("Conteúdo não encontrado.");
  return post;
}

export async function updateStudioPost(userId: number, postId: number, patch: Partial<Omit<ContentPost, "id" | "userId" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await getStudioPost(userId, postId);
  await db.update(contentPosts).set({ ...patch, updatedAt: new Date() }).where(and(eq(contentPosts.id, postId), eq(contentPosts.userId, userId)));
  return getStudioPost(userId, postId);
}

export async function updateBrandProfile(userId: number, patch: Partial<typeof brandProfiles.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await ensureStudioDefaults(userId);
  await db.update(brandProfiles).set({ ...patch, updatedAt: new Date() }).where(eq(brandProfiles.userId, userId));
  const [brand] = await db.select().from(brandProfiles).where(eq(brandProfiles.userId, userId)).limit(1);
  return brand;
}

export async function createContentSource(userId: number, values: Omit<typeof contentSources.$inferInsert, "id" | "userId" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const result = await db.insert(contentSources).values({ ...values, userId });
  const [source] = await db.select().from(contentSources).where(and(eq(contentSources.id, Number(result[0].insertId)), eq(contentSources.userId, userId))).limit(1);
  return source;
}

export async function createKnowledgeMaterial(userId: number, values: Omit<typeof knowledgeMaterials.$inferInsert, "id" | "userId" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const result = await db.insert(knowledgeMaterials).values({ ...values, userId });
  const [material] = await db.select().from(knowledgeMaterials).where(and(eq(knowledgeMaterials.id, Number(result[0].insertId)), eq(knowledgeMaterials.userId, userId))).limit(1);
  return material;
}

export async function recordDecision(userId: number, postId: number, reviewerName: string, decision: "approved" | "rejected" | "changes_requested", notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const post = await getStudioPost(userId, postId);
  const status: ContentStatus = decision === "approved" ? "approved" : decision === "rejected" ? "rejected" : "draft";
  await db.insert(approvalLogs).values({ postId, reviewerId: userId, reviewerName, decision, notes });
  await db.update(contentPosts).set({
    status,
    approvalOwnerId: userId,
    approvalOwnerName: reviewerName,
    approvalNotes: notes ?? null,
    updatedAt: new Date(),
  }).where(eq(contentPosts.id, post.id));
  return getStudioPost(userId, postId);
}

export async function getPostMedia(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await getStudioPost(userId, postId);
  return db.select().from(contentMedia).where(and(eq(contentMedia.userId, userId), eq(contentMedia.postId, postId))).orderBy(asc(contentMedia.sortOrder));
}

export async function addPostMedia(userId: number, postId: number, values: Omit<typeof contentMedia.$inferInsert, "id" | "userId" | "postId" | "sortOrder" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const post = await getStudioPost(userId, postId);
  const existing = await getPostMedia(userId, postId);
  const sortOrder = existing.length;
  const result = await db.insert(contentMedia).values({ ...values, userId, postId, sortOrder });
  if (!post.mediaUrl) {
    await db.update(contentPosts).set({ mediaUrl: values.url, updatedAt: new Date() }).where(eq(contentPosts.id, postId));
  } else {
    await db.update(contentPosts).set({ updatedAt: new Date() }).where(eq(contentPosts.id, postId));
  }
  const [media] = await db.select().from(contentMedia).where(eq(contentMedia.id, Number(result[0].insertId))).limit(1);
  return media;
}

export async function removePostMedia(userId: number, postId: number, mediaId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await getStudioPost(userId, postId);
  const [media] = await db.select().from(contentMedia).where(and(eq(contentMedia.id, mediaId), eq(contentMedia.userId, userId), eq(contentMedia.postId, postId))).limit(1);
  if (!media) throw new Error("Mídia não encontrada.");
  await db.delete(contentMedia).where(eq(contentMedia.id, mediaId));
  const remaining = await getPostMedia(userId, postId);
  await db.update(contentPosts).set({ mediaUrl: remaining[0]?.url ?? null, updatedAt: new Date() }).where(eq(contentPosts.id, postId));
  return remaining;
}

export async function getInstagramConnection(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [connection] = await db.select().from(instagramConnections).where(eq(instagramConnections.userId, userId)).limit(1);
  return connection ?? null;
}

export async function getInstagramConnectionSummary(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [connection] = await db.select({
    id: instagramConnections.id,
    instagramUserId: instagramConnections.instagramUserId,
    username: instagramConnections.username,
    tokenExpiresAt: instagramConnections.tokenExpiresAt,
    permissions: instagramConnections.permissions,
    state: instagramConnections.state,
    lastError: instagramConnections.lastError,
    connectedAt: instagramConnections.connectedAt,
    updatedAt: instagramConnections.updatedAt,
  }).from(instagramConnections).where(eq(instagramConnections.userId, userId)).limit(1);
  return connection ?? null;
}

export async function upsertInstagramConnection(userId: number, values: Omit<typeof instagramConnections.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const existing = await getInstagramConnection(userId);
  if (existing) {
    await db.update(instagramConnections).set({ ...values, updatedAt: new Date() }).where(eq(instagramConnections.id, existing.id));
  } else {
    await db.insert(instagramConnections).values({ ...values, userId });
  }
  return getInstagramConnection(userId);
}

export async function setInstagramConnectionError(userId: number, message: string) {
  const connection = await getInstagramConnection(userId);
  if (!connection) return null;
  return upsertInstagramConnection(userId, {
    instagramUserId: connection.instagramUserId,
    username: connection.username,
    accessTokenCiphertext: connection.accessTokenCiphertext,
    tokenExpiresAt: connection.tokenExpiresAt,
    permissions: connection.permissions,
    state: "error",
    lastError: message.slice(0, 3_000),
    connectedAt: connection.connectedAt,
  });
}

export type FrozenPublicationPayload = {
  postId: number;
  title: string;
  format: "post" | "carousel";
  caption: string;
  altText: string | null;
  media: Array<{ id: number; url: string; mimeType: string | null; byteSize: number | null; width: number | null; height: number | null }>;
  approvedAt: string;
};

export async function createPublicationRequest(userId: number, payload: FrozenPublicationPayload) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const connection = await getInstagramConnection(userId);
  if (!connection) throw new Error("A conta profissional do Instagram não está conectada.");
  const keySource = JSON.stringify({ postId: payload.postId, media: payload.media.map((item) => item.id), caption: payload.caption, approvedAt: payload.approvedAt });
  const idempotencyKey = Buffer.from(keySource).toString("base64url").slice(0, 128);
  const [existing] = await db.select().from(publicationJobs).where(and(eq(publicationJobs.userId, userId), eq(publicationJobs.idempotencyKey, idempotencyKey))).limit(1);
  if (existing) {
    if (existing.status === "failed" || existing.status === "cancelled") {
      await db.update(publicationJobs).set({ status: "pending_confirmation", confirmedAt: null, confirmedByUserId: null, scheduledAt: null, scheduleCronTaskUid: null, lastError: null, updatedAt: new Date() }).where(eq(publicationJobs.id, existing.id));
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
  const [job] = await db.select().from(publicationJobs).where(eq(publicationJobs.id, Number(result[0].insertId))).limit(1);
  return job;
}

export async function getPublicationJob(userId: number, jobId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [job] = await db.select().from(publicationJobs).where(and(eq(publicationJobs.userId, userId), eq(publicationJobs.id, jobId))).limit(1);
  if (!job) throw new Error("Solicitação de publicação não encontrada.");
  return job;
}

export async function getPublicationJobByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [job] = await db.select().from(publicationJobs).where(eq(publicationJobs.scheduleCronTaskUid, taskUid)).limit(1);
  return job ?? null;
}

export async function updatePublicationJob(jobId: number, patch: Partial<Omit<typeof publicationJobs.$inferInsert, "id" | "userId" | "postId" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.update(publicationJobs).set({ ...patch, updatedAt: new Date() }).where(eq(publicationJobs.id, jobId));
  const [job] = await db.select().from(publicationJobs).where(eq(publicationJobs.id, jobId)).limit(1);
  if (!job) throw new Error("Solicitação de publicação não encontrada.");
  return job;
}

export async function recordPublicationAttempt(jobId: number, values: Omit<typeof publicationAttempts.$inferInsert, "id" | "jobId" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const result = await db.insert(publicationAttempts).values({ jobId, ...values });
  const [attempt] = await db.select().from(publicationAttempts).where(eq(publicationAttempts.id, Number(result[0].insertId))).limit(1);
  return attempt;
}

export async function getInstagramStudioData(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const connection = await getInstagramConnectionSummary(userId);
  const jobs = await db.select({
    id: publicationJobs.id,
    postId: publicationJobs.postId,
    status: publicationJobs.status,
    confirmedAt: publicationJobs.confirmedAt,
    scheduledAt: publicationJobs.scheduledAt,
    testContainerId: publicationJobs.testContainerId,
    testedAt: publicationJobs.testedAt,
    containerId: publicationJobs.containerId,
    mediaId: publicationJobs.mediaId,
    permalink: publicationJobs.permalink,
    attemptCount: publicationJobs.attemptCount,
    lastError: publicationJobs.lastError,
    publishedAt: publicationJobs.publishedAt,
    createdAt: publicationJobs.createdAt,
    updatedAt: publicationJobs.updatedAt,
  }).from(publicationJobs).where(eq(publicationJobs.userId, userId)).orderBy(desc(publicationJobs.updatedAt)).limit(25);
  return { connection, jobs };
}
