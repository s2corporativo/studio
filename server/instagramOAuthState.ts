import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { ENV } from "./_core/env";

type OAuthStatePayload = { userId: number; nonce: string; expiresAt: number };

function secret() {
  if (!ENV.cookieSecret) throw new Error("A chave de sessão necessária para proteger a conexão não está disponível.");
  return `${ENV.cookieSecret}:instagram-oauth-v1`;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createInstagramOAuthState(userId: number) {
  const payload: OAuthStatePayload = { userId, nonce: randomBytes(18).toString("base64url"), expiresAt: Date.now() + 10 * 60 * 1000 };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyInstagramOAuthState(state: string): OAuthStatePayload | null {
  const [encoded, signature] = state.split(".");
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  const valid = Buffer.byteLength(signature) === Buffer.byteLength(expected) && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as OAuthStatePayload;
    if (!Number.isInteger(payload.userId) || !payload.nonce || payload.expiresAt <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
