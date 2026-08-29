export const facebookPageScopes = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
] as const;

export type FacebookPageSummary = {
  id: string;
  name: string;
  tasks: string[];
  accessToken: string;
};

export type FacebookPagesApiConfig = {
  appId: string;
  appSecret: string;
  apiVersion: string;
};

function assertHttps(value: string, label: string) {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error(`${label} deve usar HTTPS.`);
  return url;
}

export function normalizeMetaGraphVersion(input: string) {
  const value = input.trim();
  if (!/^v\d+\.\d+$/.test(value)) throw new Error("Versão da Meta Graph API inválida.");
  return value;
}

export function getFacebookPagesConfigFromEnv(): FacebookPagesApiConfig | null {
  const appId = process.env.META_FACEBOOK_APP_ID?.trim();
  const appSecret = process.env.META_FACEBOOK_APP_SECRET?.trim();
  const apiVersion = process.env.META_GRAPH_API_VERSION?.trim();
  if (!appId || !appSecret || !apiVersion) return null;
  return { appId, appSecret, apiVersion: normalizeMetaGraphVersion(apiVersion) };
}

export function buildFacebookPagesAuthorizationUrl(input: {
  appId: string;
  apiVersion: string;
  redirectUri: string;
  state: string;
}) {
  if (!input.appId.trim()) throw new Error("App ID da Meta é obrigatório.");
  if (!input.state.trim()) throw new Error("OAuth state é obrigatório.");
  const redirectUri = assertHttps(input.redirectUri, "Redirect URI");
  const version = normalizeMetaGraphVersion(input.apiVersion);
  const url = new URL(`https://www.facebook.com/${version}/dialog/oauth`);
  url.searchParams.set("client_id", input.appId.trim());
  url.searchParams.set("redirect_uri", redirectUri.toString());
  url.searchParams.set("state", input.state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", facebookPageScopes.join(","));
  return url.toString();
}

function graphUrl(apiVersion: string, path: string) {
  return new URL(`https://graph.facebook.com/${normalizeMetaGraphVersion(apiVersion)}/${path.replace(/^\/+/, "")}`);
}

function safeProviderError(status: number, body: unknown) {
  const data = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const error = data.error && typeof data.error === "object" ? data.error as Record<string, unknown> : {};
  const code = typeof error.code === "number" ? error.code : undefined;
  const type = typeof error.type === "string" ? error.type : undefined;
  return `Meta Graph API recusou a operação (HTTP ${status}${type ? `, ${type}` : ""}${code !== undefined ? `, código ${code}` : ""}).`;
}

async function parseJson(response: Response) {
  return response.json().catch(() => ({}));
}

export async function exchangeFacebookAuthorizationCode(input: {
  config: FacebookPagesApiConfig;
  redirectUri: string;
  code: string;
  fetchImpl?: typeof fetch;
}) {
  if (!input.code.trim()) throw new Error("Código OAuth ausente.");
  const fetchImpl = input.fetchImpl ?? fetch;
  const url = graphUrl(input.config.apiVersion, "oauth/access_token");
  url.searchParams.set("client_id", input.config.appId);
  url.searchParams.set("client_secret", input.config.appSecret);
  url.searchParams.set("redirect_uri", assertHttps(input.redirectUri, "Redirect URI").toString());
  url.searchParams.set("code", input.code);
  const response = await fetchImpl(url, { signal: AbortSignal.timeout(15_000) });
  const body = await parseJson(response) as { access_token?: string; expires_in?: number };
  if (!response.ok || !body.access_token) throw new Error(safeProviderError(response.status, body));
  return { accessToken: body.access_token, expiresIn: body.expires_in ?? null };
}

export async function listManagedFacebookPages(input: {
  apiVersion: string;
  userAccessToken: string;
  fetchImpl?: typeof fetch;
}): Promise<FacebookPageSummary[]> {
  if (!input.userAccessToken.trim()) throw new Error("User access token ausente.");
  const fetchImpl = input.fetchImpl ?? fetch;
  const url = graphUrl(input.apiVersion, "me/accounts");
  url.searchParams.set("fields", "id,name,access_token,tasks");
  const response = await fetchImpl(url, {
    headers: { Authorization: `Bearer ${input.userAccessToken}` },
    signal: AbortSignal.timeout(15_000),
  });
  const body = await parseJson(response) as { data?: Array<{ id?: string; name?: string; access_token?: string; tasks?: string[] }> };
  if (!response.ok) throw new Error(safeProviderError(response.status, body));
  return (body.data ?? []).flatMap(page => {
    if (!page.id || !page.name || !page.access_token) return [];
    return [{ id: page.id, name: page.name, accessToken: page.access_token, tasks: Array.isArray(page.tasks) ? page.tasks : [] }];
  });
}

export function assertFacebookPublishConfirmed(confirmed: boolean) {
  if (!confirmed) throw new Error("Publicação no Facebook exige confirmação humana explícita.");
}

export async function publishFacebookPageFeedPost(input: {
  apiVersion: string;
  pageId: string;
  pageAccessToken: string;
  message: string;
  confirmedByHuman: boolean;
  link?: string | null;
  fetchImpl?: typeof fetch;
}) {
  assertFacebookPublishConfirmed(input.confirmedByHuman);
  if (!/^[0-9]+$/.test(input.pageId)) throw new Error("Page ID inválido.");
  if (!input.pageAccessToken.trim()) throw new Error("Page access token ausente.");
  if (!input.message.trim() && !input.link) throw new Error("Informe mensagem ou link para publicação.");
  const fetchImpl = input.fetchImpl ?? fetch;
  const url = graphUrl(input.apiVersion, `${input.pageId}/feed`);
  const payload: Record<string, string | boolean> = { published: true };
  if (input.message.trim()) payload.message = input.message.trim();
  if (input.link) payload.link = assertHttps(input.link, "Link da publicação").toString();
  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.pageAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20_000),
  });
  const body = await parseJson(response) as { id?: string; post_id?: string };
  if (!response.ok || (!body.id && !body.post_id)) throw new Error(safeProviderError(response.status, body));
  return { externalPostId: body.post_id ?? body.id! };
}
