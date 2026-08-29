import { decryptExternalToken } from "./externalTokenCrypto";
import { getConnectedFacebookPage } from "./externalConnectionsDb";
import { getFacebookPagesConfigFromEnv, normalizeMetaGraphVersion, publishFacebookPageFeedPost } from "./facebookPagesApi";
import { assertApprovalStillValid } from "./socialOsGovernance";
import { getStudioPost } from "./socialStudioDb";
import { recordAuditEvent } from "./socialOsDb";

async function parseJson(response: Response) { return response.json().catch(() => ({})); }
function safeFacebookError(status: number, body: unknown) { const data = body && typeof body === "object" ? body as Record<string, unknown> : {}; const error = data.error && typeof data.error === "object" ? data.error as Record<string, unknown> : {}; const code = typeof error.code === "number" ? error.code : undefined; return `A Meta recusou a verificação da Página (HTTP ${status}${code !== undefined ? `, código ${code}` : ""}).`; }

export async function testConnectedFacebookPage(userId: number, fetchImpl: typeof fetch = fetch) {
  const config = getFacebookPagesConfigFromEnv(); if (!config) throw new Error("A integração do Facebook ainda não possui configuração completa."); const connection = await getConnectedFacebookPage(userId); if (!connection) throw new Error("Selecione uma Página do Facebook antes de testar a conexão.");
  const token = decryptExternalToken("facebook", connection.accessTokenCiphertext); const version = normalizeMetaGraphVersion(config.apiVersion); const url = new URL(`https://graph.facebook.com/${version}/${connection.externalAccountId}`); url.searchParams.set("fields", "id,name");
  const response = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15_000) }); const body = await parseJson(response) as { id?: string; name?: string }; if (!response.ok || !body.id) throw new Error(safeFacebookError(response.status, body));
  await recordAuditEvent(userId, "facebook.connection.tested", "external_connection", connection.id, { pageId: body.id, ok: true }); return { ok: true, pageId: body.id, pageName: body.name ?? connection.accountName };
}

export async function publishApprovedFacebookPost(input: { userId: number; postId: number; confirmedByHuman: boolean; link?: string | null }) {
  if (!input.confirmedByHuman) throw new Error("Publicação no Facebook exige confirmação humana explícita."); const config = getFacebookPagesConfigFromEnv(); if (!config) throw new Error("A integração do Facebook ainda não possui configuração completa.");
  const [post, connection] = await Promise.all([getStudioPost(input.userId, input.postId), getConnectedFacebookPage(input.userId)]); if (!connection) throw new Error("Nenhuma Página do Facebook está selecionada para publicação."); await assertApprovalStillValid(input.userId, input.postId);
  const message = [post.hook, post.caption, post.cta, post.hashtags].filter(Boolean).join("\n\n").trim(); if (!message && !input.link) throw new Error("O conteúdo aprovado não possui texto ou link publicável."); const token = decryptExternalToken("facebook", connection.accessTokenCiphertext);
  const result = await publishFacebookPageFeedPost({ apiVersion: config.apiVersion, pageId: connection.externalAccountId, pageAccessToken: token, message, confirmedByHuman: true, link: input.link ?? null });
  await recordAuditEvent(input.userId, "facebook.post.published", "content_post", input.postId, { pageId: connection.externalAccountId, externalPostId: result.externalPostId }); return result;
}
