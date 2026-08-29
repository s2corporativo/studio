import type { Request } from "express";

const PRODUCTION_ORIGIN = "https://depaulasoc-5hpbpodx.manus.space";

export function getExternalOAuthOrigin(req: Request) {
  if (process.env.NODE_ENV === "production") return PRODUCTION_ORIGIN;
  const forwardedHost = req.get("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const forwardedProto = req.get("x-forwarded-proto")?.split(",")[0];
  const protocol = forwardedProto || req.protocol || "https";
  if (!host) throw new Error("Não foi possível determinar o endereço de retorno da aplicação.");
  return new URL(`${protocol}://${host}`).origin;
}

export function getFacebookRedirectUri(req: Request) { return `${getExternalOAuthOrigin(req)}/api/facebook/oauth/callback`; }
