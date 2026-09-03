import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { InsertUser, users } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _sqlite: Database | null = null;

export async function getDb() {
  if (!_db) {
    const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "./db/custom.db";
    try {
      _sqlite = new Database(dbPath, { create: true });
      _sqlite.exec("PRAGMA journal_mode = WAL;");
      _sqlite.exec("PRAGMA foreign_keys = ON;");
      _db = drizzle(_sqlite);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: any = { openId: user.openId };
    if (user.name !== undefined) values.name = user.name ?? null;
    if (user.email !== undefined) values.email = user.email ?? null;
    if (user.loginMethod !== undefined) values.loginMethod = user.loginMethod ?? null;
    if (user.lastSignedIn !== undefined) values.lastSignedIn = user.lastSignedIn;
    if (user.role !== undefined) values.role = user.role;
    if (!values.lastSignedIn) values.lastSignedIn = new Date();

    // SQLite: onConflictDoUpdate
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: {
        name: values.name,
        email: values.email,
        loginMethod: values.loginMethod,
        lastSignedIn: values.lastSignedIn,
        role: values.role,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
