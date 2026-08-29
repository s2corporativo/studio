import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { ENV } from "./_core/env";

const VERSION = "v1";
export const externalTokenProviders = ["facebook", "linkedin", "tiktok", "youtube", "google_business", "meta_ads", "google_ads"] as const;
export type ExternalTokenProvider = (typeof externalTokenProviders)[number];

function encryptionKey(provider: ExternalTokenProvider) {
  if (!ENV.cookieSecret) throw new Error("Não foi possível proteger a credencial externa porque a chave de sessão não está disponível.");
  return createHash("sha256").update(`${ENV.cookieSecret}:external-token:${provider}:v1`).digest();
}

export function encryptExternalToken(provider: ExternalTokenProvider, token: string) {
  if (!token) throw new Error("Credencial externa vazia não pode ser armazenada.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(provider), iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [VERSION, provider, iv.toString("base64url"), authTag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptExternalToken(provider: ExternalTokenProvider, value: string) {
  const [version, storedProvider, ivPart, tagPart, encryptedPart] = value.split(".");
  if (version !== VERSION || storedProvider !== provider || !ivPart || !tagPart || !encryptedPart) {
    throw new Error("A credencial externa armazenada não possui formato compatível com o provedor solicitado.");
  }
  try {
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(provider), Buffer.from(ivPart, "base64url"));
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(encryptedPart, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    throw new Error("Não foi possível abrir a credencial externa armazenada. Reconecte a conta correspondente.");
  }
}
