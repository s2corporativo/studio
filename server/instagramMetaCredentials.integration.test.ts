import { describe, expect, it } from "vitest";

const appId = process.env.META_INSTAGRAM_APP_ID;
const appSecret = process.env.META_INSTAGRAM_APP_SECRET;
const shouldRunExternalMetaValidation = process.env.RUN_META_CREDENTIALS_CHECK === "true";

describe("credenciais seguras do aplicativo Meta", () => {
  const testExternalCredentials = shouldRunExternalMetaValidation ? it : it.skip;

  testExternalCredentials("valida o aplicativo por consulta mínima sem expor credenciais", async () => {
    expect(appId, "Defina META_INSTAGRAM_APP_ID no cofre seguro antes do teste externo.").toBeTruthy();
    expect(appSecret, "Defina META_INSTAGRAM_APP_SECRET no cofre seguro antes do teste externo.").toBeTruthy();
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
