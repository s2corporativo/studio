import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./_core/env", async importOriginal => {
  const actual = await importOriginal<typeof import("./_core/env")>();
  return { ...actual, ENV: { ...actual.ENV, metaInstagramAppId: "test-meta-app-id", metaInstagramAppSecret: "test-meta-app-secret" } };
});

import { validateInstagramMetaCredentials } from "./instagramApi";

describe("validação técnica de credenciais Meta", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("aceita somente uma resposta de token com estrutura válida", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ access_token: "x".repeat(24) }), { status: 200 })));
    await expect(validateInstagramMetaCredentials()).resolves.toEqual({ configured: true, validated: true });
  });

  it("sanitiza a recusa da Meta sem retornar credenciais ou token", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 101 } }), { status: 400 })));
    await expect(validateInstagramMetaCredentials()).resolves.toEqual({ configured: true, validated: false, code: "101" });
  });
});
