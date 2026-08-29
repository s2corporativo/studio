import { desc, eq } from "drizzle-orm";
import { automationSettings, brandProfiles, editorialTopics } from "../drizzle/schema";
import { getDb } from "./db";
import { ensureStudioDefaults } from "./socialStudioDb";

export async function getBrandAutomationContext(userId: number) {
  await ensureStudioDefaults(userId);
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");

  const [[brand], [automation]] = await Promise.all([
    db.select().from(brandProfiles).where(eq(brandProfiles.userId, userId)).limit(1),
    db.select().from(automationSettings).where(eq(automationSettings.userId, userId)).limit(1),
  ]);

  if (!brand) throw new Error("Perfil de marca não encontrado.");
  if (!automation) throw new Error("Configuração de automação não encontrada.");
  return { brand, automation };
}

export async function getCampaignPlanningContext(userId: number) {
  await ensureStudioDefaults(userId);
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");

  const [[brand], [automation], topics] = await Promise.all([
    db.select().from(brandProfiles).where(eq(brandProfiles.userId, userId)).limit(1),
    db.select().from(automationSettings).where(eq(automationSettings.userId, userId)).limit(1),
    db.select().from(editorialTopics).where(eq(editorialTopics.userId, userId)).orderBy(desc(editorialTopics.createdAt)),
  ]);

  if (!brand) throw new Error("Perfil de marca não encontrado.");
  if (!automation) throw new Error("Configuração de automação não encontrada.");
  return { brand, automation, topics };
}
