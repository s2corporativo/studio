import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import * as db from "../db";

// S2 Studio: auto-login administrativo, agora CONTROLADO POR FLAG (STU-01).
//
// Antes: qualquer requisição sem sessão recebia um usuário admin universal,
// expondo toda a API (publicações Meta, IA, storage) a visitantes anônimos.
//
// Agora: o auto-login só ocorre quando S2_AUTO_LOGIN=1 estiver definido
// explicitamente no ambiente (modo dev/single-tenant consciente). Sem a flag,
// requisições não autenticadas recebem user=null e os procedimentos
// protectedProcedure/adminProcedure respondem 401/403 (fail-closed).

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

const AUTO_LOGIN_ENABLED = process.env.S2_AUTO_LOGIN === "1";

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

  // Auto-login APENAS com flag explícita (fail-closed por padrão)
  if (!user && AUTO_LOGIN_ENABLED) {
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
