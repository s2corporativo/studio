import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getHashtagGroups: vi.fn(),
  createHashtagGroup: vi.fn(),
  updateHashtagGroup: vi.fn(),
  removeHashtagGroup: vi.fn(),
  recordHashtagGroupUsage: vi.fn(),
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

describe("biblioteca de hashtags", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lista grupos somente no escopo do usuário autenticado", async () => {
    mocks.getHashtagGroups.mockResolvedValue([]);
    const caller = socialStudioRouter.createCaller(createContext(41));

    await caller.hashtagGroups();

    expect(mocks.getHashtagGroups).toHaveBeenCalledWith(41);
  });

  it("cria um grupo com nome, área, tags e descrição", async () => {
    mocks.createHashtagGroup.mockResolvedValue({ id: 1 });
    const caller = socialStudioRouter.createCaller(createContext(41));

    await caller.addHashtagGroup({
      name: "Direito trabalhista — base",
      area: "Trabalhista",
      tags: "#direitodotrabalho #clt #advogadotrabalhista",
      description: "Uso recorrente em posts de atualidade trabalhista.",
    });

    expect(mocks.createHashtagGroup).toHaveBeenCalledWith(41, {
      name: "Direito trabalhista — base",
      area: "Trabalhista",
      tags: "#direitodotrabalho #clt #advogadotrabalhista",
      description: "Uso recorrente em posts de atualidade trabalhista.",
    });
  });

  it("atualiza um grupo existente do próprio usuário", async () => {
    mocks.updateHashtagGroup.mockResolvedValue({ id: 9 });
    const caller = socialStudioRouter.createCaller(createContext(41));

    await caller.updateHashtagGroup({ id: 9, name: "Atualizado", area: null, tags: "#novo", description: null });

    expect(mocks.updateHashtagGroup).toHaveBeenCalledWith(41, 9, { name: "Atualizado", area: null, tags: "#novo", description: null });
  });

  it("remove um grupo do próprio usuário", async () => {
    mocks.removeHashtagGroup.mockResolvedValue({ id: 9 });
    const caller = socialStudioRouter.createCaller(createContext(41));

    await caller.removeHashtagGroup({ id: 9 });

    expect(mocks.removeHashtagGroup).toHaveBeenCalledWith(41, 9);
  });

  it("registra o uso de um grupo incrementando o contador", async () => {
    mocks.recordHashtagGroupUsage.mockResolvedValue({ id: 9, usageCount: 3 });
    const caller = socialStudioRouter.createCaller(createContext(41));

    await caller.useHashtagGroup({ id: 9 });

    expect(mocks.recordHashtagGroupUsage).toHaveBeenCalledWith(41, 9);
  });
});
