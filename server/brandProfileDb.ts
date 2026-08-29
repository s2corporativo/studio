import { eq } from "drizzle-orm";
import { brandProfiles } from "../drizzle/schema";
import { getDb } from "./db";
import { ensureStudioDefaults } from "./socialStudioDb";

export async function getBrandProfile(userId: number) {
  await ensureStudioDefaults(userId);
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [brand] = await db
    .select()
    .from(brandProfiles)
    .where(eq(brandProfiles.userId, userId))
    .limit(1);
  if (!brand) throw new Error("Perfil de marca não encontrado.");
  return brand;
}
