import { ENV } from "./_core/env";

const API_VERSION = "v26.0";
const GRAPH_BASE_URL = `https://graph.instagram.com/${API_VERSION}`;
const OAUTH_AUTHORIZE_URL = "https://www.instagram.com/oauth/authorize";
const OAUTH_TOKEN_URL = "https://api.instagram.com/oauth/access_token";

type MetaErrorBody = { error?: { message?: string; code?: number; type?: string }; error_message?: string; code?: number };

export class InstagramApiError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = "InstagramApiError";
  }
}

export function isInstagramMetaConfigured() { return Boolean(ENV.metaInstagramAppId && ENV.metaInstagramAppSecret); }

function requireMetaConfig() {
  if (!isInstagramMetaConfigured()) throw new InstagramApiError("A aplicação Meta ainda não foi configurada no ambiente seguro.", "META_NOT_CONFIGURED");
  return { appId: ENV.metaInstagramAppId, appSecret: ENV.metaInstagramAppSecret };
}

function toMetaError(body: MetaErrorBody, fallback: string) {
  const message = body.error?.message || body.error_message || fallback;
  return new InstagramApiError(message, String(body.error?.code ?? body.code ?? "META_REQUEST_FAILED"));
}

async function responseJson<T>(response: Response, fallback: string): Promise<T> {
  const body = await response.json().catch(() => ({})) as T & MetaErrorBody;
  if (!response.ok) throw toMetaError(body, fallback);
  return body;
}

async function graphRequest<T>(path: string, token: string, options: { method?: "GET" | "POST"; body?: Record<string, unknown> } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${GRAPH_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers: { authorization: `Bearer ${token}`, ...(options.body ? { "content-type": "application/json" } : {}) },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    return responseJson<T>(response, "A Meta não aceitou a solicitação de publicação.");
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new InstagramApiError("A Meta não respondeu dentro do limite de segurança.", "META_TIMEOUT");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function buildInstagramBusinessLoginUrl(redirectUri: string, state: string) {
  const { appId } = requireMetaConfig();
  const url = new URL(OAUTH_AUTHORIZE_URL);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "instagram_business_basic,instagram_business_content_publish");
  url.searchParams.set("state", state);
  url.searchParams.set("enable_fb_login", "false");
  return url.toString();
}

export async function exchangeInstagramAuthorizationCode(code: string, redirectUri: string) {
  const { appId, appSecret } = requireMetaConfig();
  const form = new FormData();
  form.set("client_id", appId); form.set("client_secret", appSecret); form.set("grant_type", "authorization_code"); form.set("redirect_uri", redirectUri); form.set("code", code.replace(/#_$/, ""));
  const shortResponse = await responseJson<{ data?: Array<{ access_token: string; user_id: string; permissions?: string }>; access_token?: string; user_id?: string; permissions?: string }>(await fetch(OAUTH_TOKEN_URL, { method: "POST", body: form }), "Não foi possível trocar o código de autorização do Instagram.");
  const shortToken = shortResponse.data?.[0]?.access_token ?? shortResponse.access_token;
  const instagramUserId = shortResponse.data?.[0]?.user_id ?? shortResponse.user_id;
  const permissions = shortResponse.data?.[0]?.permissions ?? shortResponse.permissions ?? "";
  if (!shortToken || !instagramUserId) throw new InstagramApiError("A resposta da Meta não trouxe a identificação da conta profissional.", "INVALID_OAUTH_RESPONSE");
  const exchange = new URL("https://graph.instagram.com/access_token");
  exchange.searchParams.set("grant_type", "ig_exchange_token"); exchange.searchParams.set("client_secret", appSecret); exchange.searchParams.set("access_token", shortToken);
  const longResponse = await responseJson<{ access_token?: string; expires_in?: number }>(await fetch(exchange), "Não foi possível obter o token de longa duração do Instagram.");
  if (!longResponse.access_token) throw new InstagramApiError("A Meta não retornou um token de longa duração.", "INVALID_LONG_TOKEN_RESPONSE");
  return { accessToken: longResponse.access_token, instagramUserId, permissions, expiresInSeconds: longResponse.expires_in ?? 60 * 24 * 60 * 60 };
}

export async function getInstagramProfile(token: string) { return graphRequest<{ id?: string; user_id?: string; username?: string }>("/me?fields=id,user_id,username", token); }
export async function getInstagramPublishingLimit(instagramUserId: string, token: string) { return graphRequest<{ data?: Array<{ quota_usage?: number; config?: { quota_total?: number; quota_duration?: number } }> }>(`/${instagramUserId}/content_publishing_limit?fields=quota_usage,config`, token); }

export async function createInstagramTestContainer(input: { instagramUserId: string; token: string; mediaUrls: string[]; caption: string }) {
  if (!input.mediaUrls.length) throw new InstagramApiError("Não há mídia para validar no teste não público.", "TEST_MEDIA_MISSING");
  if (input.mediaUrls.length === 1) {
    const result = await graphRequest<{ id?: string }>(`/${input.instagramUserId}/media`, input.token, { method: "POST", body: { image_url: input.mediaUrls[0], caption: input.caption } });
    if (!result.id) throw new InstagramApiError("A Meta não retornou o container temporário de teste.", "TEST_CONTAINER_NOT_CREATED");
    return { containerId: result.id };
  }
  const children = await Promise.all(input.mediaUrls.map(imageUrl => graphRequest<{ id?: string }>(`/${input.instagramUserId}/media`, input.token, { method: "POST", body: { image_url: imageUrl, is_carousel_item: true } })));
  const childIds = children.map(child => child.id).filter((id): id is string => Boolean(id));
  if (childIds.length !== input.mediaUrls.length) throw new InstagramApiError("A Meta não retornou todos os containers temporários do carrossel.", "TEST_CAROUSEL_ITEMS_FAILED");
  await Promise.all(childIds.map(id => waitForInstagramContainer(id, input.token)));
  const result = await graphRequest<{ id?: string }>(`/${input.instagramUserId}/media`, input.token, { method: "POST", body: { media_type: "CAROUSEL", children: childIds.join(","), caption: input.caption } });
  if (!result.id) throw new InstagramApiError("A Meta não retornou o container temporário do carrossel.", "TEST_CAROUSEL_CONTAINER_FAILED");
  return { containerId: result.id };
}

export async function getInstagramContainerStatus(containerId: string, token: string) {
  return graphRequest<{ id?: string; status_code?: "EXPIRED" | "ERROR" | "FINISHED" | "IN_PROGRESS" | "PUBLISHED"; status?: string }>(`/${containerId}?fields=id,status_code,status`, token);
}

const CONTAINER_STATUS_POLL_INTERVAL_MS = 5_000;
const CONTAINER_STATUS_MAX_WAIT_MS = 45_000;

async function waitForInstagramContainer(containerId: string, token: string, timeoutMs = CONTAINER_STATUS_MAX_WAIT_MS) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const status = await getInstagramContainerStatus(containerId, token);
    if (status.status_code === "FINISHED" || status.status_code === "PUBLISHED") return status;
    if (status.status_code === "ERROR" || status.status_code === "EXPIRED") throw new InstagramApiError(`A Meta não concluiu o processamento da mídia (${status.status_code}).`, `CONTAINER_${status.status_code}`);
    const remaining = timeoutMs - (Date.now() - startedAt);
    if (remaining <= 0) break;
    await new Promise(resolve => setTimeout(resolve, Math.min(CONTAINER_STATUS_POLL_INTERVAL_MS, remaining)));
  }
  throw new InstagramApiError("A Meta ainda está processando a mídia. O fluxo foi interrompido antes do timeout da aplicação; tente novamente em instantes.", "CONTAINER_STILL_PROCESSING");
}

export async function publishInstagramImages(input: { instagramUserId: string; token: string; mediaUrls: string[]; caption: string; altText?: string | null }) {
  if (input.mediaUrls.length === 0) throw new InstagramApiError("Não há mídia validada para publicar.", "NO_MEDIA");
  if (input.mediaUrls.length > 10) throw new InstagramApiError("Um carrossel do Instagram aceita no máximo 10 mídias.", "CAROUSEL_LIMIT_EXCEEDED");
  const createImage = (imageUrl: string, isCarouselItem: boolean) => graphRequest<{ id?: string }>(`/${input.instagramUserId}/media`, input.token, { method: "POST", body: { image_url: imageUrl, ...(isCarouselItem ? { is_carousel_item: true } : {}), ...(input.altText ? { alt_text: input.altText } : {}) } });
  let containerId: string | undefined;
  if (input.mediaUrls.length === 1) {
    const result = await graphRequest<{ id?: string }>(`/${input.instagramUserId}/media`, input.token, { method: "POST", body: { image_url: input.mediaUrls[0], caption: input.caption, ...(input.altText ? { alt_text: input.altText } : {}) } });
    containerId = result.id;
  } else {
    const children = await Promise.all(input.mediaUrls.map(url => createImage(url, true)));
    const childIds = children.map(child => child.id).filter((id): id is string => Boolean(id));
    if (childIds.length !== input.mediaUrls.length) throw new InstagramApiError("A Meta não retornou todos os containers do carrossel.", "CAROUSEL_CONTAINER_FAILED");
    await Promise.all(childIds.map(id => waitForInstagramContainer(id, input.token)));
    const carousel = await graphRequest<{ id?: string }>(`/${input.instagramUserId}/media`, input.token, { method: "POST", body: { media_type: "CAROUSEL", children: childIds.join(","), caption: input.caption } });
    containerId = carousel.id;
  }
  if (!containerId) throw new InstagramApiError("A Meta não retornou o container de publicação.", "CONTAINER_NOT_CREATED");
  await waitForInstagramContainer(containerId, input.token);
  const published = await graphRequest<{ id?: string }>(`/${input.instagramUserId}/media_publish`, input.token, { method: "POST", body: { creation_id: containerId } });
  if (!published.id) throw new InstagramApiError("A Meta não retornou o identificador da mídia publicada.", "MEDIA_NOT_PUBLISHED");
  const detail = await graphRequest<{ permalink?: string }>(`/${published.id}?fields=permalink`, input.token).catch(() => ({ permalink: undefined }));
  return { containerId, mediaId: published.id, permalink: detail.permalink ?? null };
}
