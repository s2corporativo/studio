import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { InsertUser, users } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _sqlite: Database | null = null;

// Lazily create the drizzle instance using bun:sqlite
export async function getDb() {
  if (!_db) {
    const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "./db/social-studio.db";
    try {
      // Ensure directory exists
      const dir = dbPath.substring(0, dbPath.lastIndexOf("/"));
      if (dir) {
        try {
          await Bun.write(dir + "/.gitkeep", "");
        } catch {}
      }
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
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: any = {
      openId: user.openId,
    };

    const textFields = ["name", "email", "loginMethod"] as const;

    for (const field of textFields) {
      const value = (user as any)[field];
      if (value !== undefined) {
        values[field] = value ?? null;
      }
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    // SQLite: use onConflictDoUpdate instead of onDuplicateKeyUpdate
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
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}
