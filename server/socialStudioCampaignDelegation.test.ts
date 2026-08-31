import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  generateCampaignSafely: vi.fn(),
}));

vi.mock("./socialOsCampaign", () => ({
  generateCampaignSafely: mocks.generateCampaignSafely,
}));

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

describe("socialStudio.generateCampaign", () => {
  beforeEach(() => vi.clearAllMocks());

  it("encaminha somente entradas com chave idempotente ao serviço transacional", async () => {
    mocks.generateCampaignSafely.mockResolvedValue({ campaignRunId: 81, count: 3, reused: false });
    const caller = socialStudioRouter.createCaller(createContext(71));

    const result = await caller.generateCampaign({
      idempotencyKey: "697efdd0-0747-4f76-915a-31ef5fbc7158",
      days: 7,
      startDate: new Date("2026-08-31T12:00:00.000Z"),
      postsPerWeek: 3,
      defaultPublishTime: "18:30",
      objective: "Autoridade",
      timezone: "America/Sao_Paulo",
    });

    expect(result).toMatchObject({ campaignRunId: 81, count: 3, reused: false });
    expect(mocks.generateCampaignSafely).toHaveBeenCalledWith(71, expect.objectContaining({
      idempotencyKey: "697efdd0-0747-4f76-915a-31ef5fbc7158",
      timezone: "America/Sao_Paulo",
    }));
  });

  it("rejeita a solicitação sem chave idempotente válida antes de acessar o serviço", async () => {
    const caller = socialStudioRouter.createCaller(createContext(72));

    await expect(caller.generateCampaign({
      idempotencyKey: "sem-chave-valida",
      days: 7,
      startDate: new Date("2026-08-31T12:00:00.000Z"),
      postsPerWeek: 3,
      defaultPublishTime: "18:30",
      objective: "Autoridade",
      timezone: "America/Sao_Paulo",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(mocks.generateCampaignSafely).not.toHaveBeenCalled();
  });
});
