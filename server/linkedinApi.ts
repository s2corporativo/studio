export const linkedInOrganizationScopes = ["r_organization_admin", "w_organization_social"] as const;

export type LinkedInApiConfig = {
  clientId: string;
  clientSecret: string;
  apiVersion: string;
};

export type LinkedInOrganizationSummary = {
  id: string;
  urn: string;
  name: string;
  role: string;
};

function assertHttps(value: string, label: string) {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error(`${label} deve usar HTTPS.`);
  return url;
}

export function normalizeLinkedInVersion(input: string) {
  const value = input.trim();
  if (!/^20\d{4}$/.test(value)) throw new Error("Versão da LinkedIn API inválida. Use YYYYMM.");
  return value;
}

export function getLinkedInConfigFromEnv(): LinkedInApiConfig | null {
  const clientId = process.env.LINKEDIN_CLIENT_ID?.trim();
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET?.trim();
  const apiVersion = process.env.LINKEDIN_API_VERSION?.trim();
  if (!clientId || !clientSecret || !apiVersion) return null;
  return { clientId, clientSecret, apiVersion: normalizeLinkedInVersion(apiVersion) };
}

export function buildLinkedInAuthorizationUrl(input: { clientId: string; redirectUri: string; state: string }) {
  if (!input.clientId.trim()) throw new Error("Client ID do LinkedIn é obrigatório.");
  if (!input.state.trim()) throw new Error("OAuth state é obrigatório.");
  const redirectUri = assertHttps(input.redirectUri, "Redirect URI");
  const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", input.clientId.trim());
  url.searchParams.set("redirect_uri", redirectUri.toString());
  url.searchParams.set("state", input.state);
  url.searchParams.set("scope", linkedInOrganizationScopes.join(" "));
  return url.toString();
}

function linkedInHeaders(accessToken: string, version: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "X-Restli-Protocol-Version": "2.0.0",
    "Linkedin-Version": normalizeLinkedInVersion(version),
    "Content-Type": "application/json",
  };
}

async function parseJson(response: Response) {
  return response.json().catch(() => ({}));
}

function safeLinkedInError(status: number, body: unknown) {
  const data = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const serviceErrorCode = typeof data.serviceErrorCode === "number" ? data.serviceErrorCode : undefined;
  const code = typeof data.code === "string" ? data.code : undefined;
  return `LinkedIn recusou a operação (HTTP ${status}${serviceErrorCode !== undefined ? `, código ${serviceErrorCode}` : code ? `, ${code}` : ""}).`;
}

export async function exchangeLinkedInAuthorizationCode(input: {
  config: LinkedInApiConfig;
  redirectUri: string;
  code: string;
  fetchImpl?: typeof fetch;
}) {
  if (!input.code.trim()) throw new Error("Código OAuth do LinkedIn ausente.");
  const fetchImpl = input.fetchImpl ?? fetch;
  const response = await fetchImpl("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: input.code,
      client_id: input.config.clientId,
      client_secret: input.config.clientSecret,
      redirect_uri: assertHttps(input.redirectUri, "Redirect URI").toString(),
    }).toString(),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await parseJson(response) as { access_token?: string; expires_in?: number; scope?: string };
  if (!response.ok || !body.access_token) throw new Error(safeLinkedInError(response.status, body));
  return { accessToken: body.access_token, expiresIn: body.expires_in ?? null, scope: body.scope ?? null };
}

const knownPostingRoles = new Set(["ADMINISTRATOR", "DIRECT_SPONSORED_CONTENT_POSTER", "CONTENT_ADMIN", "CONTENT_ADMINISTRATOR"]);

export async function listLinkedInOrganizations(input: {
  accessToken: string;
  apiVersion: string;
  fetchImpl?: typeof fetch;
}): Promise<LinkedInOrganizationSummary[]> {
  if (!input.accessToken.trim()) throw new Error("Access token do LinkedIn ausente.");
  const fetchImpl = input.fetchImpl ?? fetch;
  const url = new URL("https://api.linkedin.com/rest/organizationAcls");
  url.searchParams.set("q", "roleAssignee");
  url.searchParams.set("state", "APPROVED");
  const response = await fetchImpl(url, {
    headers: linkedInHeaders(input.accessToken, input.apiVersion),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await parseJson(response) as { elements?: Array<{ state?: string; role?: string; organizationTarget?: string }> };
  if (!response.ok) throw new Error(safeLinkedInError(response.status, body));
  const candidates = (body.elements ?? []).filter(item => item.state === "APPROVED" && typeof item.role === "string" && knownPostingRoles.has(item.role) && /^urn:li:organization:\d+$/.test(item.organizationTarget ?? ""));
  const organizations: LinkedInOrganizationSummary[] = [];
  for (const item of candidates.slice(0, 50)) {
    const urn = item.organizationTarget!;
    const id = urn.split(":").at(-1)!;
    let name = `LinkedIn Organization ${id}`;
    try {
      const orgResponse = await fetchImpl(`https://api.linkedin.com/rest/organizations/${id}`, {
        headers: linkedInHeaders(input.accessToken, input.apiVersion),
        signal: AbortSignal.timeout(10_000),
      });
      const orgBody = await parseJson(orgResponse) as { localizedName?: string };
      if (orgResponse.ok && orgBody.localizedName) name = orgBody.localizedName;
    } catch {
      // Name lookup is best-effort; the organization URN remains authoritative.
    }
    organizations.push({ id, urn, name, role: item.role! });
  }
  return organizations;
}

export async function publishLinkedInOrganizationTextPost(input: {
  accessToken: string;
  apiVersion: string;
  organizationUrn: string;
  commentary: string;
  confirmedByHuman: boolean;
  fetchImpl?: typeof fetch;
}) {
  if (!input.confirmedByHuman) throw new Error("Publicação no LinkedIn exige confirmação humana explícita.");
  if (!/^urn:li:organization:\d+$/.test(input.organizationUrn)) throw new Error("URN da organização LinkedIn inválida.");
  if (!input.commentary.trim()) throw new Error("O texto do LinkedIn está vazio.");
  const fetchImpl = input.fetchImpl ?? fetch;
  const response = await fetchImpl("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: linkedInHeaders(input.accessToken, input.apiVersion),
    body: JSON.stringify({
      author: input.organizationUrn,
      commentary: input.commentary.trim(),
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const body = await parseJson(response);
  const externalPostId = response.headers.get("x-restli-id");
  if (response.status !== 201 || !externalPostId) throw new Error(safeLinkedInError(response.status, body));
  return { externalPostId };
}
