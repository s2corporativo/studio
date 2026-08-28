import { describe, expect, it } from "vitest";

const appId = process.env.META_INSTAGRAM_APP_ID;
const appSecret = process.env.META_INSTAGRAM_APP_SECRET;

describe("credenciais seguras do aplicativo Meta", () => {
  it.skipIf(!appId || !appSecret)("valida o aplicativo por consulta mínima sem expor credenciais", async () => {
    const url = new URL("https://graph.facebook.com/oauth/access_token");
    url.searchParams.set("client_id", appId!);
    url.searchParams.set("client_secret", appSecret!);
    url.searchParams.set("grant_type", "client_credentials");

    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    const body = (await response.json().catch(() => ({}))) as { access_token?: string };

    expect(response.ok, "A Meta recusou as credenciais protegidas do aplicativo.").toBe(true);
    expect(body.access_token).toEqual(expect.any(String));
    expect(body.access_token!.length).toBeGreaterThan(20);
  });
});
