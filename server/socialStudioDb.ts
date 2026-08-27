import { and, desc, eq } from "drizzle-orm";
import {
  approvalLogs,
  brandProfiles,
  contentPosts,
  contentSources,
  editorialTopics,
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
}

export async function getStudioData(userId: number) {
  await ensureStudioDefaults(userId);
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [brand] = await db.select().from(brandProfiles).where(eq(brandProfiles.userId, userId)).limit(1);
  const topics = await db.select().from(editorialTopics).where(eq(editorialTopics.userId, userId)).orderBy(desc(editorialTopics.createdAt));
  const posts = await db.select().from(contentPosts).where(eq(contentPosts.userId, userId)).orderBy(desc(contentPosts.updatedAt));
  const sources = await db.select().from(contentSources).where(eq(contentSources.userId, userId)).orderBy(desc(contentSources.verifiedAt));
  const usageByTopic = posts.reduce<Record<number, number>>((acc, post) => {
    if (post.topicId) acc[post.topicId] = (acc[post.topicId] ?? 0) + 1;
    return acc;
  }, {});
  const topTopics = topics
    .map(topic => ({ ...topic, usageCount: usageByTopic[topic.id] ?? 0 }))
    .sort((a, b) => b.usageCount - a.usageCount || a.title.localeCompare(b.title, "pt-BR"))
    .slice(0, 6);
  return { brand, topics, posts, sources, topTopics };
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
