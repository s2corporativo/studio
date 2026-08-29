// Preconfigured storage helpers for Manus WebDev templates
// Uploads via Forge Server presigned URL to S3 (PUT direct).
// Downloads return /manus-storage/{key} paths served via 307 redirect.

import { ENV } from "./_core/env";
import { normalizeStudioStorageKey, safeHttpsUrl } from "./storagePolicy";

function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;

  if (!forgeUrl || !forgeKey) {
    throw new Error("Storage não configurado no ambiente seguro.");
  }

  const parsedUrl = safeHttpsUrl(forgeUrl);
  if (!parsedUrl) throw new Error("Endpoint de storage inválido.");
  return { forgeUrl: parsedUrl.toString().replace(/\/+$/, ""), forgeKey };
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

function toUploadBlob(data: Buffer | Uint8Array | string, contentType: string) {
  if (typeof data === "string") return new Blob([data], { type: contentType });
  const arrayBuffer = Uint8Array.from(data).buffer;
  return new Blob([arrayBuffer], { type: contentType });
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeStudioStorageKey(relKey));

  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);

  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!presignResp.ok) {
    throw new Error(`Não foi possível preparar o upload (${presignResp.status}).`);
  }

  const payload = (await presignResp.json()) as { url?: unknown };
  const uploadUrl = safeHttpsUrl(payload.url);
  if (!uploadUrl) throw new Error("O backend de storage retornou uma URL de upload inválida.");

  const uploadResp = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: toUploadBlob(data, contentType),
  });

  if (!uploadResp.ok) {
    throw new Error(`Falha ao enviar o arquivo ao storage (${uploadResp.status}).`);
  }

  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeStudioStorageKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = normalizeStudioStorageKey(relKey);

  const getUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
  getUrl.searchParams.set("path", key);

  const resp = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!resp.ok) {
    throw new Error(`Não foi possível obter a URL do arquivo (${resp.status}).`);
  }

  const payload = (await resp.json()) as { url?: unknown };
  const signedUrl = safeHttpsUrl(payload.url);
  if (!signedUrl) throw new Error("O backend de storage retornou uma URL inválida.");
  return signedUrl.toString();
}
