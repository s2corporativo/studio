import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getSocialProfiles: vi.fn(),
  linkInstagramProfileToConnection: vi.fn(),
  isInstagramMetaConfigured: vi.fn(),
  buildInstagramBusinessLoginUrl: vi.fn(),
  createInstagramOAuthState: vi.fn(),
  getInstagramRedirectUri: vi.fn(),
}));

vi.mock("./socialStudioDb", async importOriginal => {
  const actual = await importOriginal<typeof import("./socialStudioDb")>();
  return { ...actual, getSocialProfiles: mocks.getSocialProfiles, linkInstagramProfileToConnection: mocks.linkInstagramProfileToConnection };
});
vi.mock("./instagramApi", async importOriginal => {
  const actual = await importOriginal<typeof import("./instagramApi")>();
  return { ...actual, isInstagramMetaConfigured: mocks.isInstagramMetaConfigured, buildInstagramBusinessLoginUrl: mocks.buildInstagramBusinessLoginUrl };
});
vi.mock("./instagramOAuthState", async importOriginal => {
  const actual = await importOriginal<typeof import("./instagramOAuthState")>();
  return { ...actual, createInstagramOAuthState: mocks.createInstagramOAuthState };
});
vi.mock("./instagramOrigins", async importOriginal => {
  const actual = await importOriginal<typeof import("./instagramOrigins")>();
  return { ...actual, getInstagramRedirectUri: mocks.getInstagramRedirectUri };
});

import { socialStudioRouter } from "./routers/socialStudio";

function createContext(userId: number): TrpcContext {
  return {
    user: { id: userId, openId: `usuario-${userId}`, name: "Usuário de teste", email: `usuario-${userId}@example.com`, loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("vínculo OAuth do perfil de Instagram", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isInstagramMetaConfigured.mockReturnValue(true);
    mocks.getInstagramRedirectUri.mockReturnValue("https://studio.example/api/instagram/oauth/callback");
    mocks.createInstagramOAuthState.mockReturnValue("estado-assinado");
    mocks.buildInstagramBusinessLoginUrl.mockReturnValue("https://www.instagram.com/oauth/authorize");
    mocks.linkInstagramProfileToConnection.mockResolvedValue({ id: 2, socialProfileId: 9, state: "pending" });
  });

  it("vincula o perfil explicitamente selecionado antes de redirecionar ao OAuth", async () => {
    mocks.getSocialProfiles.mockResolvedValue([{ id: 9, network: "instagram", state: "active" }]);
    const caller = socialStudioRouter.createCaller(createContext(31));

    const result = await caller.beginInstagramConnection({ profileId: 9 });

    expect(mocks.linkInstagramProfileToConnection).toHaveBeenCalledWith(31, 9);
    expect(mocks.linkInstagramProfileToConnection).toHaveResolvedWith(expect.objectContaining({ socialProfileId: 9, state: "pending" }));
    expect(mocks.buildInstagramBusinessLoginUrl).toHaveBeenCalledWith("https://studio.example/api/instagram/oauth/callback", "estado-assinado");
    expect(result.authorizationUrl).toBe("https://www.instagram.com/oauth/authorize");
  });

  it("seleciona automaticamente somente a única conta Instagram ativa", async () => {
    mocks.getSocialProfiles.mockResolvedValue([{ id: 12, network: "instagram", state: "active" }, { id: 13, network: "linkedin", state: "active" }]);
    const caller = socialStudioRouter.createCaller(createContext(44));

    await caller.beginInstagramConnection();

    expect(mocks.linkInstagramProfileToConnection).toHaveBeenCalledWith(44, 12);
  });
});
