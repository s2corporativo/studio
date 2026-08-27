import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { ENV } from "./_core/env";

const VERSION = "v1";

function encryptionKey() {
  if (!ENV.cookieSecret) throw new Error("Não foi possível proteger o token porque a chave de sessão não está disponível.");
  return createHash("sha256").update(`${ENV.cookieSecret}:instagram-token-v1`).digest();
}

export function encryptInstagramToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), authTag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptInstagramToken(value: string) {
  const [version, ivPart, tagPart, encryptedPart] = value.split(".");
  if (version !== VERSION || !ivPart || !tagPart || !encryptedPart) throw new Error("O token do Instagram armazenado não possui formato válido.");
  try {
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivPart, "base64url"));
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(encryptedPart, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    throw new Error("Não foi possível abrir o token do Instagram armazenado. Reconecte a conta profissional.");
  }
}
