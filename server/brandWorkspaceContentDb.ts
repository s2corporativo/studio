import { and, eq } from "drizzle-orm";
import { brandContentBindings, brandWorkspaces } from "../drizzle/brandWorkspaceSchema";
import { contentPosts } from "../drizzle/schema";
import { getDb } from "./db";

export async function createBrandBoundPost(
  userId: number,
  brandWorkspaceId: number,
  values: Omit<typeof contentPosts.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">,
) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  return db.transaction(async tx => {
    const [workspace] = await tx.select({ id: brandWorkspaces.id, status: brandWorkspaces.status })
      .from(brandWorkspaces)
      .where(and(eq(brandWorkspaces.userId, userId), eq(brandWorkspaces.id, brandWorkspaceId)))
      .limit(1);
    if (!workspace || workspace.status !== "active") throw new Error("Marca ativa não encontrada.");

    const result = await tx.insert(contentPosts).values({ ...values, userId });
    const postId = Number(result[0].insertId);
    await tx.insert(brandContentBindings).values({ userId, brandWorkspaceId, postId });
    const [post] = await tx.select().from(contentPosts)
      .where(and(eq(contentPosts.userId, userId), eq(contentPosts.id, postId)))
      .limit(1);
    if (!post) throw new Error("Falha ao criar conteúdo vinculado à marca.");
    return post;
  });
}
