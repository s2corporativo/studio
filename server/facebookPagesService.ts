import { createHash } from "node:crypto";
import { decryptExternalToken } from "./externalTokenCrypto";
import { getConnectedFacebookPage, getExternalConnectionById } from "./externalConnectionsDb";
import { getFacebookPagesConfigFromEnv, normalizeMetaGraphVersion, publishFacebookPageFeedPost } from "./facebookPagesApi";
import { assertApprovalStillValid } from "./socialOsGovernance";
import { getStudioPost } from "./socialStudioDb";
import { recordAuditEvent } from "./socialOsDb";
import { claimExternalPublicationJob, completeExternalPublicationJob, failExternalPublicationJob, getExternalPublicationJob, getOrCreateExternalPublicationJob, quarantineExternalPublicationJob } from "./externalPublicationDb";

async function parseJson(response: Response) { return response.json().catch(() => ({})); }
function safeFacebookError(status: number, body: unknown) { const data = body && typeof body === "object" ? body as Record<string, unknown> : {}; const error = data.error && typeof data.error === "object" ? data.error as Record<string, unknown> : {}; const code = typeof error.code === "number" ? error.code : undefined; return `A Meta recusou a verificação da Página (HTTP ${status}${code !== undefined ? `, código ${code}` : ""}).`; }
export function isUncertainExternalOutcome(error: unknown) { return error instanceof TypeError || (error instanceof Error && ["AbortError", "TimeoutError"].includes(error.name)); }

type FacebookFrozenPayload = { version: 1; pageId: string; externalConnectionId: number; message: string; link: string | null; approvalHash: string };

export async function testConnectedFacebookPage(userId: number, fetchImpl: typeof fetch = fetch) {
  const config = getFacebookPagesConfigFromEnv(); if (!config) throw new Error("A integração do Facebook ainda não possui configuração completa."); const connection = await getConnectedFacebookPage(userId); if (!connection) throw new Error("Selecione uma Página do Facebook antes de testar a conexão.");
  const token = decryptExternalToken("facebook", connection.accessTokenCiphertext); const version = normalizeMetaGraphVersion(config.apiVersion); const url = new URL(`https://graph.facebook.com/${version}/${connection.externalAccountId}`); url.searchParams.set("fields", "id,name");
  const response = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15_000) }); const body = await parseJson(response) as { id?: string; name?: string }; if (!response.ok || !body.id) throw new Error(safeFacebookError(response.status, body));
  await recordAuditEvent(userId, "facebook.connection.tested", "external_connection", connection.id, { pageId: body.id, ok: true }); return { ok: true, pageId: body.id, pageName: body.name ?? connection.accountName };
}

export async function requestFacebookPublication(input: { userId: number; postId: number; link?: string | null }) {
  const [post, connection, approval] = await Promise.all([getStudioPost(input.userId, input.postId), getConnectedFacebookPage(input.userId), assertApprovalStillValid(input.userId, input.postId)]);
  if (!connection) throw new Error("Nenhuma Página do Facebook está selecionada para publicação.");
  const message = [post.hook, post.caption, post.cta, post.hashtags].filter(Boolean).join("\n\n").trim();
  const link = input.link?.trim() || null;
  if (link && new URL(link).protocol !== "https:") throw new Error("O link da publicação deve usar HTTPS.");
  if (!message && !link) throw new Error("O conteúdo aprovado não possui texto ou link publicável.");
  const payload: FacebookFrozenPayload = { version: 1, pageId: connection.externalAccountId, externalConnectionId: connection.id, message, link, approvalHash: approval.contentHash };
  const idempotencyKey = createHash("sha256").update(JSON.stringify({ userId: input.userId, provider: "facebook", postId: input.postId, payload })).digest("hex");
  const job = await getOrCreateExternalPublicationJob({ userId: input.userId, provider: "facebook", externalConnectionId: connection.id, postId: input.postId, approvalHash: approval.contentHash, idempotencyKey, frozenPayload: JSON.stringify(payload), status: "pending_confirmation", confirmedByUserId: null, confirmedAt: null, attemptCount: 0, externalPostId: null, lastError: null, publishedAt: null });
  await recordAuditEvent(input.userId, "facebook.publication.requested", "external_publication_job", job.id, { postId: input.postId, pageId: connection.externalAccountId, approvalHash: approval.contentHash });
  return { id: job.id, status: job.status, postId: job.postId, pageId: connection.externalAccountId, pageName: connection.accountName, alreadyPublished: job.status === "published", externalPostId: job.externalPostId };
}

export async function confirmAndPublishFacebookJob(input: { userId: number; jobId: number; confirmedByHuman: boolean }) {
  if (!input.confirmedByHuman) throw new Error("Publicação no Facebook exige confirmação humana explícita.");
  let job = await getExternalPublicationJob(input.userId, input.jobId);
  if (job.provider !== "facebook") throw new Error("O job informado não pertence ao Facebook.");
  if (job.status === "published") return { jobId: job.id, status: job.status, externalPostId: job.externalPostId, idempotent: true };
  if (job.status === "processing") throw new Error("A publicação já está em processamento.");
  if (job.status === "unknown_outcome") throw new Error("O resultado externo deste job é incerto. Verifique a Página antes de qualquer nova tentativa para evitar publicação duplicada.");
  if (job.status === "cancelled") throw new Error("Este job de publicação foi cancelado.");
  const approval = await assertApprovalStillValid(input.userId, job.postId);
  if (approval.contentHash !== job.approvalHash) throw new Error("A aprovação atual não corresponde ao conteúdo congelado neste job. Solicite uma nova publicação.");
  const payload = JSON.parse(job.frozenPayload) as FacebookFrozenPayload;
  if (payload.version !== 1 || payload.approvalHash !== job.approvalHash || payload.externalConnectionId !== job.externalConnectionId) throw new Error("Payload congelado do Facebook inválido.");
  const connection = await getExternalConnectionById(input.userId, "facebook", job.externalConnectionId);
  if (!connection || connection.state !== "connected" || connection.externalAccountId !== payload.pageId) throw new Error("A Página vinculada ao job não está mais conectada.");
  const claimed = await claimExternalPublicationJob(input.userId, job.id);
  if (!claimed) {
    job = await getExternalPublicationJob(input.userId, job.id);
    if (job.status === "published") return { jobId: job.id, status: job.status, externalPostId: job.externalPostId, idempotent: true };
    throw new Error("O job não pôde ser adquirido para publicação; atualize o estado e tente novamente.");
  }
  try {
    const config = getFacebookPagesConfigFromEnv(); if (!config) throw new Error("A integração do Facebook ainda não possui configuração completa.");
    const token = decryptExternalToken("facebook", connection.accessTokenCiphertext);
    const result = await publishFacebookPageFeedPost({ apiVersion: config.apiVersion, pageId: payload.pageId, pageAccessToken: token, message: payload.message, confirmedByHuman: true, link: payload.link });
    const completed = await completeExternalPublicationJob(input.userId, job.id, result.externalPostId);
    await recordAuditEvent(input.userId, "facebook.post.published", "content_post", job.postId, { jobId: job.id, pageId: payload.pageId, externalPostId: result.externalPostId });
    return { jobId: completed.id, status: completed.status, externalPostId: completed.externalPostId, idempotent: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida na publicação do Facebook.";
    if (isUncertainExternalOutcome(error)) {
      await quarantineExternalPublicationJob(input.userId, job.id, "Resultado externo incerto por falha de transporte. Reconciliação manual obrigatória antes de nova tentativa.");
      await recordAuditEvent(input.userId, "facebook.publication.unknown_outcome", "external_publication_job", job.id, { postId: job.postId, pageId: payload.pageId });
    } else {
      await failExternalPublicationJob(input.userId, job.id, message);
    }
    throw error;
  }
}
