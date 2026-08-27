import { decryptInstagramToken } from "./instagramCrypto";
import { getInstagramPublishingLimit, InstagramApiError, publishInstagramImages } from "./instagramApi";
import { getInstagramConnection, getPublicationJob, recordPublicationAttempt, updatePublicationJob, updateStudioPost, type FrozenPublicationPayload } from "./socialStudioDb";

function parseFrozenPayload(value: string): FrozenPublicationPayload {
  try {
    const payload = JSON.parse(value) as FrozenPublicationPayload;
    if (!payload.postId || !payload.caption || !Array.isArray(payload.media) || !payload.media.length) throw new Error("dados incompletos");
    return payload;
  } catch {
    throw new Error("A versão congelada para publicação está inválida. Crie uma nova solicitação.");
  }
}

export async function executeConfirmedInstagramPublication(userId: number, jobId: number) {
  const job = await getPublicationJob(userId, jobId);
  if (job.status === "published") return job;
  if (job.status !== "queued" || !job.confirmedAt) throw new Error("A publicação precisa de confirmação humana explícita antes do envio ao Instagram.");
  const connection = await getInstagramConnection(userId);
  if (!connection || connection.state !== "connected" || !connection.instagramUserId || !connection.accessTokenCiphertext) {
    throw new Error("A conta profissional do Instagram não está conectada ou precisa ser reconectada.");
  }
  if (connection.tokenExpiresAt && connection.tokenExpiresAt.getTime() <= Date.now()) {
    throw new Error("O token da conta do Instagram expirou. Reconecte a conta antes de publicar.");
  }
  const payload = parseFrozenPayload(job.frozenPayload);
  const token = decryptInstagramToken(connection.accessTokenCiphertext);
  await updatePublicationJob(job.id, { status: "processing", attemptCount: job.attemptCount + 1, lastError: null });
  await recordPublicationAttempt(job.id, { stage: "preflight", outcome: "started", detail: "Confirmação humana validada; iniciando envio à Meta." });
  try {
    const limit = await getInstagramPublishingLimit(connection.instagramUserId, token);
    const used = limit.data?.[0]?.quota_usage ?? 0;
    const total = limit.data?.[0]?.config?.quota_total ?? 100;
    if (used >= total) throw new InstagramApiError("O limite de publicações da conta no período atual foi atingido.", "PUBLISHING_LIMIT_REACHED");
    await recordPublicationAttempt(job.id, { stage: "preflight", outcome: "succeeded", detail: `Limite verificado: ${used}/${total} publicações no período.` });
    await recordPublicationAttempt(job.id, { stage: "container", outcome: "started", detail: `Enviando ${payload.media.length} imagem(ns) JPEG previamente validada(s).` });
    const result = await publishInstagramImages({ instagramUserId: connection.instagramUserId, token, mediaUrls: payload.media.map((media) => media.url), caption: payload.caption, altText: payload.altText });
    await recordPublicationAttempt(job.id, { stage: "container", outcome: "succeeded", externalReference: result.containerId, detail: "Container de publicação criado pela Meta." });
    await recordPublicationAttempt(job.id, { stage: "publish", outcome: "succeeded", externalReference: result.mediaId, detail: "Mídia publicada pela Meta após confirmação humana." });
    const publishedAt = new Date();
    await updatePublicationJob(job.id, { status: "published", containerId: result.containerId, mediaId: result.mediaId, permalink: result.permalink, publishedAt, lastError: null });
    await updateStudioPost(userId, job.postId, { status: "published", publishedAt });
    return getPublicationJob(userId, jobId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha inesperada ao publicar no Instagram.";
    await recordPublicationAttempt(job.id, { stage: "publish", outcome: "failed", errorCode: error instanceof InstagramApiError ? error.code : "UNEXPECTED", detail: message.slice(0, 3_000) });
    await updatePublicationJob(job.id, { status: "failed", lastError: message.slice(0, 3_000) });
    throw new Error("A publicação não foi enviada. O ocorrido foi registrado no histórico de auditoria.");
  }
}
