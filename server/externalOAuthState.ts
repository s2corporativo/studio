import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { ENV } from "./_core/env";

export type ExternalOAuthProvider = "facebook" | "linkedin";
type ExternalOAuthStatePayload = { userId: number; profileId: number | null; provider: ExternalOAuthProvider; nonce: string; expiresAt: number };

function secret(provider: ExternalOAuthProvider) {
  if (!ENV.cookieSecret) throw new Error("A chave de sessão necessária para proteger a conexão externa não está disponível.");
  return `${ENV.cookieSecret}:external-oauth:${provider}:v1`;
}

function sign(provider: ExternalOAuthProvider, value: string) { return createHmac("sha256", secret(provider)).update(value).digest("base64url"); }

export function createExternalOAuthState(userId: number, provider: ExternalOAuthProvider, profileId?: number | null) {
  const payload: ExternalOAuthStatePayload = { userId, profileId: profileId ?? null, provider, nonce: randomBytes(18).toString("base64url"), expiresAt: Date.now() + 10 * 60 * 1000 };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(provider, encoded)}`;
}

export function verifyExternalOAuthState(state: string, provider: ExternalOAuthProvider): ExternalOAuthStatePayload | null {
  const [encoded, signature] = state.split(".");
  if (!encoded || !signature) return null;
  const expected = sign(provider, encoded);
  const valid = Buffer.byteLength(signature) === Buffer.byteLength(expected) && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as ExternalOAuthStatePayload;
    if (payload.provider !== provider || !Number.isInteger(payload.userId) || (payload.profileId !== null && !Number.isInteger(payload.profileId)) || !payload.nonce || payload.expiresAt <= Date.now()) return null;
    return payload;
  } catch { return null; }
}
