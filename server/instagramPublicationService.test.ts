import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./instagramCrypto", () => ({ decryptInstagramToken: vi.fn(() => "token-seguro") }));
vi.mock("./instagramApi", () => ({
  InstagramApiError: class InstagramApiError extends Error { constructor(message: string, public code?: string) { super(message); } },
  createInstagramTestContainer: vi.fn(),
  getInstagramPublishingLimit: vi.fn(),
  publishInstagramImages: vi.fn(),
}));
vi.mock("./socialStudioDb", () => ({
  claimQueuedPublicationJob: vi.fn(),
  getInstagramConnection: vi.fn(),
  getPublicationJob: vi.fn(),
  recordPublicationAttempt: vi.fn(),
  setInstagramConnectionError: vi.fn(),
  updatePublicationJob: vi.fn(),
  updateStudioPost: vi.fn(),
  upsertInstagramConnection: vi.fn(),
}));

import { createInstagramTestContainer, InstagramApiError, getInstagramPublishingLimit, publishInstagramImages } from "./instagramApi";
import { executeConfirmedInstagramPublication, testInstagramPublication } from "./instagramPublicationService";
import { claimQueuedPublicationJob, getInstagramConnection, getPublicationJob, recordPublicationAttempt, updatePublicationJob, updateStudioPost } from "./socialStudioDb";

const frozenPayload = JSON.stringify({ postId: 17, title: "Título", format: "post", caption: "Legenda aprovada", altText: null, media: [{ id: 3, url: "https://studio.example.com/manus-storage/arte.jpg", mimeType: "image/jpeg", byteSize: 300_000, width: 1080, height: 1350 }], approvedAt: "2026-08-27T12:00:00.000Z" });
const queuedJob = { id: 91, userId: 5, postId: 17, status: "queued", confirmedAt: new Date(), attemptCount: 0, testContainerId: "test-container-0", testedAt: new Date(), frozenPayload } as any;
const connection = { state: "connected", instagramUserId: "ig-7", accessTokenCiphertext: "cipher", tokenExpiresAt: new Date(Date.now() + 3_600_000) } as any;

describe("serviço de publicação confirmada", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPublicationJob).mockResolvedValue(queuedJob);
    vi.mocked(claimQueuedPublicationJob).mockResolvedValue(true);
    vi.mocked(getInstagramConnection).mockResolvedValue(connection);
    vi.mocked(getInstagramPublishingLimit).mockResolvedValue({ data: [{ quota_usage: 1, config: { quota_total: 50 } }] });
    vi.mocked(createInstagramTestContainer).mockResolvedValue({ containerId: "test-container-1" });
    vi.mocked(publishInstagramImages).mockResolvedValue({ containerId: "container-1", mediaId: "media-1", permalink: "https://www.instagram.com/p/example/" });
    vi.mocked(updatePublicationJob).mockResolvedValue(queuedJob);
    vi.mocked(updateStudioPost).mockResolvedValue({} as any);
  });

  it("bloqueia execução que ainda não possui confirmação humana explícita", async () => {
    vi.mocked(getPublicationJob).mockResolvedValue({ ...queuedJob, status: "pending_confirmation", confirmedAt: null });
    await expect(executeConfirmedInstagramPublication(5, 91)).rejects.toThrow("confirmação humana explícita");
    expect(getInstagramConnection).not.toHaveBeenCalled();
    expect(publishInstagramImages).not.toHaveBeenCalled();
  });

  it("bloqueia envio público quando o teste não público ainda não foi aprovado", async () => {
    vi.mocked(getPublicationJob).mockResolvedValue({ ...queuedJob, testContainerId: null, testedAt: null });
    await expect(executeConfirmedInstagramPublication(5, 91)).rejects.toThrow("teste não público");
    expect(publishInstagramImages).not.toHaveBeenCalled();
  });

  it("não repete uma publicação que já foi registrada como concluída", async () => {
    vi.mocked(getPublicationJob).mockResolvedValue({ ...queuedJob, status: "published" });
    await expect(executeConfirmedInstagramPublication(5, 91)).resolves.toMatchObject({ status: "published" });
    expect(publishInstagramImages).not.toHaveBeenCalled();
  });

  it("trava concorrência e impede duas execuções do mesmo job", async () => {
    vi.mocked(claimQueuedPublicationJob).mockResolvedValue(false);
    await expect(executeConfirmedInstagramPublication(5, 91)).rejects.toThrow("já está sendo processada");
    expect(publishInstagramImages).not.toHaveBeenCalled();
  });

  it("usa 50 como fallback conservador quando a Meta não retorna quota_total", async () => {
    vi.mocked(getPublicationJob).mockResolvedValue({ ...queuedJob, status: "pending_confirmation", confirmedAt: null });
    vi.mocked(getInstagramPublishingLimit).mockResolvedValue({ data: [{ quota_usage: 1 }] });
    await testInstagramPublication(5, 91);
    expect(recordPublicationAttempt).toHaveBeenCalledWith(91, expect.objectContaining({ stage: "preflight", outcome: "succeeded", detail: "Teste autorizado; limite atual 1/50." }));
  });

  it("registra falha da Meta na trilha de auditoria e encerra o job em falha", async () => {
    vi.mocked(publishInstagramImages).mockRejectedValue(new InstagramApiError("A Meta rejeitou o container.", "META_REJECTED"));
    await expect(executeConfirmedInstagramPublication(5, 91)).rejects.toThrow("ocorrido foi registrado");
    expect(recordPublicationAttempt).toHaveBeenCalledWith(91, expect.objectContaining({ stage: "publish", outcome: "failed", errorCode: "META_REJECTED" }));
    expect(updatePublicationJob).toHaveBeenCalledWith(91, expect.objectContaining({ status: "failed", lastError: "A Meta rejeitou o container." }));
  });

  it("valida o payload em container temporário sem chamar publicação pública", async () => {
    vi.mocked(getPublicationJob).mockResolvedValue({ ...queuedJob, status: "pending_confirmation", confirmedAt: null });
    await testInstagramPublication(5, 91);
    expect(createInstagramTestContainer).toHaveBeenCalledWith(expect.objectContaining({ instagramUserId: "ig-7", mediaUrls: ["https://studio.example.com/manus-storage/arte.jpg"] }));
    expect(publishInstagramImages).not.toHaveBeenCalled();
    expect(updatePublicationJob).toHaveBeenCalledWith(91, expect.objectContaining({ testContainerId: "test-container-1", testedAt: expect.any(Date) }));
  });

  it("registra falha da Meta no teste e mantém a publicação bloqueada", async () => {
    vi.mocked(getPublicationJob).mockResolvedValue({ ...queuedJob, status: "pending_confirmation", confirmedAt: null });
    vi.mocked(createInstagramTestContainer).mockRejectedValue(new InstagramApiError("JPEG rejeitado.", "TEST_MEDIA_REJECTED"));
    await expect(testInstagramPublication(5, 91)).rejects.toThrow("teste não público falhou");
    expect(recordPublicationAttempt).toHaveBeenCalledWith(91, expect.objectContaining({ stage: "container", outcome: "failed", errorCode: "TEST_MEDIA_REJECTED" }));
    expect(updatePublicationJob).toHaveBeenCalledWith(91, expect.objectContaining({ lastError: "JPEG rejeitado." }));
    expect(publishInstagramImages).not.toHaveBeenCalled();
  });
});
