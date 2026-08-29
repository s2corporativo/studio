import { afterEach, describe, expect, it } from "vitest";
import { getInstagramOAuthOrigin, getInstagramRedirectUri } from "./instagramOrigins";

const originalNodeEnv = process.env.NODE_ENV;
const originalPublicAppOrigin = process.env.PUBLIC_APP_ORIGIN;

const request = (host = "studio.local", forwardedHost?: string) => ({
  protocol: "http",
  get(name: string) {
    if (name === "host") return host;
    if (name === "x-forwarded-host") return forwardedHost;
    if (name === "x-forwarded-proto") return forwardedHost ? "https" : undefined;
    return undefined;
  },
}) as any;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  if (originalPublicAppOrigin === undefined) delete process.env.PUBLIC_APP_ORIGIN;
  else process.env.PUBLIC_APP_ORIGIN = originalPublicAppOrigin;
});

describe("origem OAuth do Instagram", () => {
  it("usa a origem encaminhada no ambiente de desenvolvimento", () => {
    process.env.NODE_ENV = "development";
    expect(getInstagramRedirectUri(request("localhost:3000", "preview.manus.com"))).toBe("https://preview.manus.com/api/instagram/oauth/callback");
  });

  it("mantém a origem publicada atual como fallback de produção", () => {
    process.env.NODE_ENV = "production";
    delete process.env.PUBLIC_APP_ORIGIN;
    expect(getInstagramOAuthOrigin(request("origem-maliciosa.example"))).toBe("https://depaulasoc-5hpbpodx.manus.space");
  });

  it("prioriza PUBLIC_APP_ORIGIN HTTPS configurada", () => {
    process.env.NODE_ENV = "production";
    process.env.PUBLIC_APP_ORIGIN = "https://studio.example.com";
    expect(getInstagramRedirectUri(request("origem-maliciosa.example"))).toBe("https://studio.example.com/api/instagram/oauth/callback");
  });

  it.each([
    "http://studio.example.com",
    "https://user:pass@studio.example.com",
    "https://studio.example.com/oauth",
    "https://studio.example.com/?from=unsafe",
    "https://studio.example.com/#unsafe",
  ])("rejeita PUBLIC_APP_ORIGIN insegura: %s", value => {
    process.env.NODE_ENV = "production";
    process.env.PUBLIC_APP_ORIGIN = value;
    expect(() => getInstagramOAuthOrigin(request())).toThrow(/PUBLIC_APP_ORIGIN/);
  });
});
