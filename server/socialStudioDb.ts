import { createHash } from "node:crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  approvalLogs,
  assetLibraryItems,
  automationSettings,
  brandProfiles,
  contentMedia,
  contentPosts,
  contentSources,
  editorialTopics,
  instagramConnections,
  knowledgeMaterials,
  publicationAttempts,
  publicationJobs,
  socialProfiles as socialProfilesTable,
  type ContentPost,
  type ContentStatus,
} from "../drizzle/schema";
import { getDb } from "./db";
import { profileStateForInstagramConnection, type InstagramProfileState } from "../shared/instagramProfileConnection";

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

const studioDefaultsInFlight = new Map<number, Promise<void>>();

async function initializeStudioDefaults(userId: number) {
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

  const existingAutomation = await db.select({ id: automationSettings.id }).from(automationSettings).where(eq(automationSettings.userId, userId)).limit(1);
  if (existingAutomation.length === 0) {
    await db.insert(automationSettings).values({
      userId,
      enabled: false,
      cadence: "weekdays",
      postsPerWeek: 5,
      defaultPublishTime: "18:30",
      planningHorizonDays: 30,
      requireApproval: true,
      refreshRadarDaily: true,
      preferredAreas: "Trabalhista,Consumidor,Empresarial,Ambiental,Tributário",
      preferredFormats: "carousel,post,reel",
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

export async function ensureStudioDefaults(userId: number) {
  const existing = studioDefaultsInFlight.get(userId);
  if (existing) return existing;
  const task = initializeStudioDefaults(userId).finally(() => studioDefaultsInFlight.delete(userId));
  studioDefaultsInFlight.set(userId, task);
  return task;
}

export async function getStudioData(userId: number) {
  await ensureStudioDefaults(userId);
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [brand] = await db.select().from(brandProfiles).where(eq(brandProfiles.userId, userId)).limit(1);
  const [automation] = await db.select().from(automationSettings).where(eq(automationSettings.userId, userId)).limit(1);
  const topics = await db.select().from(editorialTopics).where(eq(editorialTopics.userId, userId)).orderBy(desc(editorialTopics.createdAt));
  const posts = await db.select().from(contentPosts).where(eq(contentPosts.userId, userId)).orderBy(desc(contentPosts.updatedAt));
  const media = await db.select().from(contentMedia).where(eq(contentMedia.userId, userId)).orderBy(asc(contentMedia.postId), asc(contentMedia.sortOrder));
  const assets = await db.select().from(assetLibraryItems).where(eq(assetLibraryItems.userId, userId)).orderBy(asc(assetLibraryItems.area), asc(assetLibraryItems.groupKey), asc(assetLibraryItems.slideOrder), asc(assetLibraryItems.fileName));
  const sources = await db.select().from(contentSources).where(eq(contentSources.userId, userId)).orderBy(desc(contentSources.verifiedAt));
  const knowledge = await db.select().from(knowledgeMaterials).where(eq(knowledgeMaterials.userId, userId)).orderBy(desc(knowledgeMaterials.createdAt));
  const socialProfiles = await db.select().from(socialProfilesTable).where(eq(socialProfilesTable.userId, userId)).orderBy(asc(socialProfilesTable.network), asc(socialProfilesTable.displayName));
  const usageByTopic = posts.reduce<Record<number, number>>((acc, post) => {
    if (post.topicId) acc[post.topicId] = (acc[post.topicId] ?? 0) + 1;
    return acc;
  }, {});
  const topTopics = topics
    .map(topic => ({ ...topic, usageCount: usageByTopic[topic.id] ?? 0 }))
    .sort((a, b) => b.usageCount - a.usageCount || a.title.localeCompare(b.title, "pt-BR"))
    .slice(0, 6);
  return { brand, automation, topics, posts, media, assets, sources, knowledge, socialProfiles, topTopics };
}

export async function getSocialProfiles(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  return db.select().from(socialProfilesTable).where(eq(socialProfilesTable.userId, userId)).orderBy(asc(socialProfilesTable.network), asc(socialProfilesTable.displayName));
}

export async function getSocialProfile(userId: number, profileId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [profile] = await db.select().from(socialProfilesTable).where(and(eq(socialProfilesTable.id, profileId), eq(socialProfilesTable.userId, userId))).limit(1);
  if (!profile) throw new Error("Perfil social não encontrado.");
  return profile;
}

export async function createSocialProfile(userId: number, values: Omit<typeof socialProfilesTable.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const result = await db.insert(socialProfilesTable).values({ ...values, userId });
  return getSocialProfile(userId, Number(result[0].insertId));
}

export async function updateSocialProfile(userId: number, profileId: number, patch: Partial<Omit<typeof socialProfilesTable.$inferSelect, "id" | "userId" | "network" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await getSocialProfile(userId, profileId);
  await db.update(socialProfilesTable).set({ ...patch, updatedAt: new Date() }).where(and(eq(socialProfilesTable.id, profileId), eq(socialProfilesTable.userId, userId)));
  return getSocialProfile(userId, profileId);
}

export async function removeSocialProfile(userId: number, profileId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await getSocialProfile(userId, profileId);
  await db.delete(socialProfilesTable).where(and(eq(socialProfilesTable.id, profileId), eq(socialProfilesTable.userId, userId)));
  return { id: profileId };
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

export async function updateAutomationSettings(userId: number, patch: Partial<typeof automationSettings.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await ensureStudioDefaults(userId);
  await db.update(automationSettings).set({ ...patch, updatedAt: new Date() }).where(eq(automationSettings.userId, userId));
  const [settings] = await db.select().from(automationSettings).where(eq(automationSettings.userId, userId)).limit(1);
  return settings;
}

export async function createContentSource(userId: number, values: Omit<typeof contentSources.$inferInsert, "id" | "userId" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const result = await db.insert(contentSources).values({ ...values, userId });
  const [source] = await db.select().from(contentSources).where(and(eq(contentSources.id, Number(result[0].insertId)), eq(contentSources.userId, userId))).limit(1);
  return source;
}

export async function getOrCreateContentSource(userId: number, values: { title: string; sourceType: string; url: string; notes?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [existing] = await db.select().from(contentSources).where(and(eq(contentSources.userId, userId), eq(contentSources.url, values.url))).limit(1);
  if (existing) return existing;
  return createContentSource(userId, { ...values, verifiedAt: new Date() });
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
  await db.update(contentPosts).set({ status, approvalOwnerId: userId, approvalOwnerName: reviewerName, approvalNotes: notes ?? null, updatedAt: new Date() }).where(eq(contentPosts.id, post.id));
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
  await db.update(contentPosts).set({ ...(post.mediaUrl ? {} : { mediaUrl: values.url }), updatedAt: new Date() }).where(eq(contentPosts.id, postId));
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
    socialProfileId: instagramConnections.socialProfileId,
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
    const { socialProfileId, ...connectionValues } = values;
    await db.update(instagramConnections).set({ ...connectionValues, socialProfileId: socialProfileId ?? existing.socialProfileId, updatedAt: new Date() }).where(eq(instagramConnections.id, existing.id));
  } else {
    await db.insert(instagramConnections).values({ ...values, userId });
  }
  return getInstagramConnection(userId);
}

export async function linkInstagramProfileToConnection(userId: number, profileId: number) {
  const profile = await getSocialProfile(userId, profileId);
  if (profile.network !== "instagram") throw new Error("Selecione um perfil de Instagram para iniciar a conexão oficial.");
  const connection = await getInstagramConnection(userId);
  const linked = await upsertInstagramConnection(userId, {
    socialProfileId: profile.id,
    instagramUserId: connection?.instagramUserId ?? null,
    username: connection?.username ?? profile.handle,
    accessTokenCiphertext: connection?.accessTokenCiphertext ?? null,
    tokenExpiresAt: connection?.tokenExpiresAt ?? null,
    permissions: connection?.permissions ?? null,
    state: "pending",
    lastError: null,
    connectedAt: connection?.connectedAt ?? null,
  });
  await updateSocialProfile(userId, profile.id, { state: profileStateForInstagramConnection("pending") });
  return linked;
}

export async function setInstagramProfileConnectionState(userId: number, profileId: number, state: InstagramProfileState) {
  const profile = await getSocialProfile(userId, profileId);
  if (profile.network !== "instagram") return profile;
  return updateSocialProfile(userId, profileId, { state });
}

export async function setInstagramConnectionError(userId: number, message: string) {
  const connection = await getInstagramConnection(userId);
  if (!connection) return null;
  const updatedConnection = await upsertInstagramConnection(userId, {
    socialProfileId: connection.socialProfileId,
    instagramUserId: connection.instagramUserId,
    username: connection.username,
    accessTokenCiphertext: connection.accessTokenCiphertext,
    tokenExpiresAt: connection.tokenExpiresAt,
    permissions: connection.permissions,
    state: "error",
    lastError: message.slice(0, 3_000),
    connectedAt: connection.connectedAt,
  });
  return updatedConnection;
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
  const keySource = {
    postId: payload.postId,
    title: payload.title,
    format: payload.format,
    caption: payload.caption,
    altText: payload.altText,
    media: payload.media.map(item => ({ id: item.id, url: item.url, mimeType: item.mimeType, byteSize: item.byteSize, width: item.width, height: item.height })),
  };
  const idempotencyKey = createHash("sha256").update(JSON.stringify(keySource)).digest("hex");
  const [existing] = await db.select().from(publicationJobs).where(and(eq(publicationJobs.userId, userId), eq(publicationJobs.idempotencyKey, idempotencyKey))).limit(1);
  if (existing) {
    if (existing.status === "failed" || existing.status === "cancelled") {
      await db.update(publicationJobs).set({
        frozenPayload: JSON.stringify(payload),
        connectionId: connection.id,
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
      return getPublicationJob(userId, existing.id);
    }
    return existing;
  }
  const result = await db.insert(publicationJobs).values({ userId, postId: payload.postId, connectionId: connection.id, status: "pending_confirmation", idempotencyKey, frozenPayload: JSON.stringify(payload) });
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

export async function claimQueuedPublicationJob(userId: number, jobId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const result = await db.update(publicationJobs).set({ status: "processing", updatedAt: new Date() }).where(and(eq(publicationJobs.id, jobId), eq(publicationJobs.userId, userId), eq(publicationJobs.status, "queued")));
  return Number((result as any)?.[0]?.affectedRows ?? 0) === 1;
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
