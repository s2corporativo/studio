import type { Request } from "express";

const DEFAULT_PRODUCTION_ORIGIN = "https://depaulasoc-5hpbpodx.manus.space";

function normalizePublicOrigin(value: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("PUBLIC_APP_ORIGIN deve ser uma origem HTTPS válida.");
  }

  if (parsed.protocol !== "https:") throw new Error("PUBLIC_APP_ORIGIN deve usar HTTPS.");
  if (parsed.username || parsed.password) throw new Error("PUBLIC_APP_ORIGIN não pode conter credenciais.");
  if (parsed.search || parsed.hash) throw new Error("PUBLIC_APP_ORIGIN não pode conter query string ou fragmento.");
  if (parsed.pathname !== "/") throw new Error("PUBLIC_APP_ORIGIN deve conter apenas a origem, sem caminho adicional.");
  return parsed.origin;
}

function productionOrigin() {
  const configured = process.env.PUBLIC_APP_ORIGIN?.trim();
  return normalizePublicOrigin(configured || DEFAULT_PRODUCTION_ORIGIN);
}

export function getInstagramOAuthOrigin(req: Request) {
  if (process.env.NODE_ENV === "production") return productionOrigin();
  const forwardedHost = req.get("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const forwardedProto = req.get("x-forwarded-proto")?.split(",")[0];
  const protocol = forwardedProto || req.protocol || "https";
  if (!host) throw new Error("Não foi possível determinar o endereço de retorno da aplicação.");
  return new URL(`${protocol}://${host}`).origin;
}

export function getInstagramRedirectUri(req: Request) {
  return `${getInstagramOAuthOrigin(req)}/api/instagram/oauth/callback`;
}
