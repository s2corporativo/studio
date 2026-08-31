import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  getPublicationJobByTaskUid: vi.fn(),
  recordPublicationAttempt: vi.fn(),
}));

vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: mocks.authenticateRequest } }));
vi.mock("./socialStudioDb", () => ({
  getPublicationJob: vi.fn(), getPublicationJobByTaskUid: mocks.getPublicationJobByTaskUid,
  recordPublicationAttempt: mocks.recordPublicationAttempt, updatePublicationJob: vi.fn(), updateStudioPost: vi.fn(),
}));
vi.mock("./_core/heartbeat", () => ({ createHeartbeatJob: vi.fn(), deleteHeartbeatJob: vi.fn() }));
vi.mock("./instagramPublicationService", () => ({ executeConfirmedInstagramPublication: vi.fn() }));

import { runInstagramPublicationSchedule } from "./instagramSchedule";

describe("resposta de falha do cron Instagram", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockRejectedValue(new Error("detalhe interno da Meta que não pode sair na resposta"));
  });

  it("não expõe a mensagem interna na resposta HTTP", async () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    await runInstagramPublicationSchedule({} as Request, { status } as unknown as Response);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ error: "scheduled-publication-failed" }));
    expect(JSON.stringify(json.mock.calls[0]?.[0])).not.toContain("detalhe interno");
  });
});
