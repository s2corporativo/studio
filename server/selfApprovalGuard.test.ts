import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));

vi.mock("./db", () => ({ getDb: mocks.getDb }));

import { assertSelfApprovalAllowed } from "./socialOsGovernance";

function fakeDb(resultQueues: unknown[][]) {
  let call = 0;
  return {
    select: () => {
      const rows = resultQueues[call++] ?? [];
      const chain = {
        from: () => chain,
        where: () => chain,
        orderBy: () => chain,
        limit: () => Promise.resolve(rows),
      };
      return chain;
    },
  };
}

describe("trava de dupla revisão (autoaprovação)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("permite aprovar quando não há configuração de automação", async () => {
    mocks.getDb.mockResolvedValue(fakeDb([[]]));
    await expect(assertSelfApprovalAllowed(7, 100)).resolves.toBeUndefined();
  });

  it("permite aprovar quando a autoaprovação está habilitada (padrão da operação solo)", async () => {
    mocks.getDb.mockResolvedValue(fakeDb([[{ allowSelfApproval: true }]]));
    await expect(assertSelfApprovalAllowed(7, 100)).resolves.toBeUndefined();
  });

  it("bloqueia quando a trava está ativa e o aprovador produziu a versão atual", async () => {
    mocks.getDb.mockResolvedValue(fakeDb([[{ allowSelfApproval: false }], [{ createdByUserId: 7 }]]));
    await expect(assertSelfApprovalAllowed(7, 100)).rejects.toThrow(/dupla revisão/i);
  });

  it("bloqueia quando a trava está ativa e ainda não existe versão registrada", async () => {
    mocks.getDb.mockResolvedValue(fakeDb([[{ allowSelfApproval: false }], []]));
    await expect(assertSelfApprovalAllowed(7, 100)).rejects.toThrow(/dupla revisão/i);
  });

  it("permite quando a versão atual foi produzida por outro revisor", async () => {
    mocks.getDb.mockResolvedValue(fakeDb([[{ allowSelfApproval: false }], [{ createdByUserId: 99 }]]));
    await expect(assertSelfApprovalAllowed(7, 100)).resolves.toBeUndefined();
  });
});
