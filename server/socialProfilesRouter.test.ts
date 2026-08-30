import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getSocialProfiles: vi.fn(),
  createSocialProfile: vi.fn(),
  updateSocialProfile: vi.fn(),
  removeSocialProfile: vi.fn(),
}));

vi.mock("./socialStudioDb", async importOriginal => {
  const actual = await importOriginal<typeof import("./socialStudioDb")>();
  return { ...actual, ...mocks };
});

import { socialStudioRouter } from "./routers/socialStudio";

function createContext(userId: number): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `usuario-${userId}`,
      name: "Usuário de teste",
      email: `usuario-${userId}@example.com`,
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("socialStudio perfis sociais", () => {
  beforeEach(() => vi.clearAllMocks());

  it("consulta perfis somente no escopo do usuário autenticado", async () => {
    mocks.getSocialProfiles.mockResolvedValue([]);
    const caller = socialStudioRouter.createCaller(createContext(41));

    await caller.socialProfiles();

    expect(mocks.getSocialProfiles).toHaveBeenCalledWith(41);
  });

  it("cadastra apenas dados públicos e descarta campos de credencial não reconhecidos", async () => {
    mocks.createSocialProfile.mockResolvedValue({ id: 1 });
    const caller = socialStudioRouter.createCaller(createContext(41));

    await caller.addSocialProfile({
      network: "instagram",
      displayName: "S2 Studio",
      handle: "@@depaulateixeira.adv",
      profileUrl: "https://www.instagram.com/depaulateixeira.adv/",
      externalAccountId: null,
      notes: "Canal institucional.",
      accessToken: "nunca-deve-ser-persistido",
    } as never);

    expect(mocks.createSocialProfile).toHaveBeenCalledWith(41, expect.objectContaining({
      network: "instagram",
      handle: "depaulateixeira.adv",
      connectionMode: "manual",
      state: "active",
    }));
    expect(mocks.createSocialProfile.mock.calls[0]?.[1]).not.toHaveProperty("accessToken");
  });

  it("encaminha atualização e remoção com o mesmo usuário autenticado", async () => {
    mocks.updateSocialProfile.mockResolvedValue({ id: 8, state: "inactive" });
    mocks.removeSocialProfile.mockResolvedValue({ id: 8 });
    const caller = socialStudioRouter.createCaller(createContext(52));

    await caller.updateSocialProfile({
      id: 8,
      displayName: "Conta institucional",
      handle: null,
      profileUrl: "https://www.linkedin.com/company/exemplo/",
      externalAccountId: null,
      notes: null,
      state: "inactive",
    });
    await caller.removeSocialProfile({ id: 8 });

    expect(mocks.updateSocialProfile).toHaveBeenCalledWith(52, 8, expect.objectContaining({ state: "inactive" }));
    expect(mocks.removeSocialProfile).toHaveBeenCalledWith(52, 8);
  });
});
