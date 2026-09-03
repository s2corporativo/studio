import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import * as db from "../db";

// S2 Studio: Auto-login — sempre retorna um usuário admin
// sem necessidade de autenticação externa.

const S2_AUTO_USER: User = {
  id: 1,
  openId: "s2-owner",
  name: "S2 Studio Admin",
  email: "admin@s2.studio",
  loginMethod: "auto",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
} as User;

// Flag para garantir que o usuário auto foi criado no banco
let autoUserInitialized = false;

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Tentar autenticar via cookie/sessão existente
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }

  // S2 Studio: Se não há usuário autenticado, usa auto-login
  if (!user) {
    // Garantir que o usuário auto existe no banco (apenas uma vez)
    if (!autoUserInitialized) {
      try {
        await db.upsertUser({
          openId: "s2-owner",
          name: "S2 Studio Admin",
          email: "admin@s2.studio",
          loginMethod: "auto",
          role: "admin",
          lastSignedIn: new Date(),
        });
        autoUserInitialized = true;
      } catch {
        // Ignora erro de DB — o usuário mock ainda funciona
      }
    }
    user = S2_AUTO_USER;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
