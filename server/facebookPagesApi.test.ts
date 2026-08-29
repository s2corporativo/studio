import { describe, expect, it, vi } from "vitest";
import {
  assertFacebookPublishConfirmed,
  buildFacebookPagesAuthorizationUrl,
  exchangeFacebookAuthorizationCode,
  exchangeFacebookLongLivedUserToken,
  listManagedFacebookPages,
  normalizeMetaGraphVersion,
  publishFacebookPageFeedPost,
} from "./facebookPagesApi";

describe("Facebook Pages API guards", () => {
  it("validates Graph API versions", () => {
    expect(normalizeMetaGraphVersion("v26.0")).toBe("v26.0");
    expect(() => normalizeMetaGraphVersion("26")).toThrow();
  });

  it("builds OAuth with minimum Page scopes and HTTPS redirect", () => {
    const url = new URL(buildFacebookPagesAuthorizationUrl({ appId: "123", apiVersion: "v26.0", redirectUri: "https://example.com/callback", state: "signed-state" }));
    expect(url.hostname).toBe("www.facebook.com");
    expect(url.searchParams.get("scope")).toContain("pages_manage_posts");
    expect(() => buildFacebookPagesAuthorizationUrl({ appId: "123", apiVersion: "v26.0", redirectUri: "http://example.com/callback", state: "signed-state" })).toThrow();
  });

  it("keeps protected app configuration out of the URL query", async () => {
    const fetchImpl = vi.fn(async (input: URL | RequestInfo, init?: RequestInit) => {
      const url = input instanceof URL ? input : new URL(String(input));
      expect(url.searchParams.has("client_secret")).toBe(false);
      expect(init?.method).toBe("POST");
      expect(String(init?.body)).toContain("client_secret=");
      return new Response(JSON.stringify({ access_token: "temporary-token", expires_in: 3600 }), { status: 200, headers: { "Content-Type": "application/json" } });
    }) as unknown as typeof fetch;
    await exchangeFacebookAuthorizationCode({ config: { appId: "123", appSecret: "protected-value", apiVersion: "v26.0" }, redirectUri: "https://example.com/callback", code: "code", fetchImpl });
  });

  it("exchanges the temporary user token before Page discovery", async () => {
    const fetchImpl = vi.fn(async (_input: URL | RequestInfo, init?: RequestInit) => {
      expect(String(init?.body)).toContain("grant_type=fb_exchange_token");
      return new Response(JSON.stringify({ access_token: "long-lived-user-token", expires_in: 5000000 }), { status: 200, headers: { "Content-Type": "application/json" } });
    }) as unknown as typeof fetch;
    const result = await exchangeFacebookLongLivedUserToken({ config: { appId: "123", appSecret: "protected-value", apiVersion: "v26.0" }, shortLivedUserAccessToken: "short", fetchImpl });
    expect(result.accessToken).toBe("long-lived-user-token");
  });

  it("discovers Page tokens using the Authorization header", async () => {
    const fetchImpl = vi.fn(async (input: URL | RequestInfo, init?: RequestInit) => {
      const url = input instanceof URL ? input : new URL(String(input));
      expect(url.pathname).toContain("/me/accounts");
      expect(url.searchParams.has("access_token")).toBe(false);
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer user-token");
      return new Response(JSON.stringify({ data: [{ id: "100", name: "Page", access_token: "page-token", tasks: ["CREATE_CONTENT"] }] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }) as unknown as typeof fetch;
    const pages = await listManagedFacebookPages({ apiVersion: "v26.0", userAccessToken: "user-token", fetchImpl });
    expect(pages).toHaveLength(1);
    expect(pages[0].id).toBe("100");
  });

  it("blocks publication before HTTP without explicit human confirmation", async () => {
    expect(() => assertFacebookPublishConfirmed(false)).toThrow();
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    await expect(publishFacebookPageFeedPost({ apiVersion: "v26.0", pageId: "100", pageAccessToken: "page-token", message: "Post", confirmedByHuman: false, fetchImpl })).rejects.toThrow();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("sanitizes provider errors instead of returning upstream details", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ error: { message: "provider-detail-placeholder", type: "OAuthException", code: 190 } }), { status: 400, headers: { "Content-Type": "application/json" } })) as unknown as typeof fetch;
    await expect(listManagedFacebookPages({ apiVersion: "v26.0", userAccessToken: "user-token", fetchImpl })).rejects.not.toThrow("provider-detail-placeholder");
  });
});
