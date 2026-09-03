import { describe, expect, it } from "vitest";
import { getInstagramOAuthOrigin, getInstagramRedirectUri } from "./instagramOrigins";

const request = (host = "studio.local", forwardedHost?: string) => ({
  protocol: "http",
  get(name: string) {
    if (name === "host") return host;
    if (name === "x-forwarded-host") return forwardedHost;
    if (name === "x-forwarded-proto") return forwardedHost ? "https" : undefined;
    return undefined;
  },
}) as any;

describe("origem OAuth do Instagram", () => {
  it("usa a origem encaminhada no ambiente de desenvolvimento", () => {
    expect(getInstagramRedirectUri(request("localhost:3000", "preview.manus.com"))).toBe("https://preview.manus.com/api/instagram/oauth/callback");
  });

  it("fixa a origem publicada no ambiente de produção", () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    expect(getInstagramOAuthOrigin(request("origem-maliciosa.example"))).toBe("https://depaulasoc-5hpbpodx.manus.space");
    process.env.NODE_ENV = previous;
  });
});
