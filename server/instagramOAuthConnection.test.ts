import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  upsertInstagramConnection: vi.fn(),
  setInstagramProfileConnectionState: vi.fn(),
  setInstagramConnectionError: vi.fn(),
}));

vi.mock("./socialStudioDb", async importOriginal => {
  const actual = await importOriginal<typeof import("./socialStudioDb")>();
  return { ...actual, ...mocks };
});

import { completeInstagramOAuthConnection, failInstagramOAuthConnection } from "./instagramOAuth";

describe("persistência do callback OAuth de Instagram", () => {
  beforeEach(() => vi.clearAllMocks());

  it("persiste a conexão concluída e atualiza o perfil externo vinculado", async () => {
    mocks.upsertInstagramConnection.mockResolvedValue({ id: 2, socialProfileId: 17, state: "connected" });
    mocks.setInstagramProfileConnectionState.mockResolvedValue({ id: 17, state: "connected" });

    await completeInstagramOAuthConnection(5, { instagramUserId: "ig-123", accessToken: "token-de-teste", expiresInSeconds: 3600, permissions: "instagram_business_basic" }, { id: "ig-123", username: "s2studio.adv" });

    expect(mocks.upsertInstagramConnection).toHaveBeenCalledWith(5, expect.objectContaining({ instagramUserId: "ig-123", username: "s2studio.adv", state: "connected" }));
    expect(mocks.setInstagramProfileConnectionState).toHaveBeenCalledWith(5, 17, "connected");
  });

  it("persiste o erro do callback para que a conexão e o perfil possam refletir atenção necessária", async () => {
    mocks.setInstagramConnectionError.mockResolvedValue({ id: 2, socialProfileId: 17, state: "error" });
    mocks.setInstagramProfileConnectionState.mockResolvedValue({ id: 17, state: "error" });

    await failInstagramOAuthConnection(5);

    expect(mocks.setInstagramConnectionError).toHaveBeenCalledWith(5, "Não foi possível concluir a conexão com a Meta. Verifique as permissões e tente novamente.");
    expect(mocks.setInstagramProfileConnectionState).toHaveBeenCalledWith(5, 17, "error");
  });
});
