import { describe, expect, it, vi } from "vitest";
import {
  buildFacebookPagesAuthorizationUrl,
  facebookPageScopes,
  listManagedFacebookPages,
  normalizeMetaGraphVersion,
  publishFacebookPageFeedPost,
} from "./facebookPagesApi";

describe("Facebook Pages API foundation", () => {
  it("builds a versioned OAuth URL with the minimum Page scopes", () => {
    const url = new URL(buildFacebookPagesAuthorizationUrl({
      appId: "123456",
      apiVersion: "v26.0",
      redirectUri: "https://example.com/api/facebook/callback",
      state: "state-value",
    }));
    expect(url.origin).toBe("https://www.facebook.com");
    expect(url.pathname).toBe("/v26.0/dialog/oauth");
    expect(url.searchParams.get("client_id")).toBe("123456");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")?.split(",")).toEqual([...facebookPageScopes]);
  });

  it("rejects an unversioned or malformed Graph API version", () => {
    expect(() => normalizeMetaGraphVersion("26.0")).toThrow();
    expect(() => normalizeMetaGraphVersion("latest")).toThrow();
    expect(normalizeMetaGraphVersion("v26.0")).toBe("v26.0");
  });

  it("rejects non-HTTPS redirect URIs", () => {
    expect(() => buildFacebookPagesAuthorizationUrl({
      appId: "123456",
      apiVersion: "v26.0",
      redirectUri: "http://example.com/callback",
      state: "state-value",
    })).toThrow("HTTPS");
  });

  it("lists managed Pages using an Authorization header and never query-string tokens", async () => {
    const fetchImpl = vi.fn(async (input: URL | RequestInfo, init?: RequestInit) => {
      const url = new URL(String(input));
      expect(url.pathname).toBe("/v26.0/me/accounts");
      expect(url.searchParams.has("access_token")).toBe(false);
      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer user-token-placeholder");
      return new Response(JSON.stringify({ data: [{ id: "42", name: "Página Teste", access_token: "page-token-placeholder", tasks: ["CREATE_CONTENT"] }] }), { status: 200 });
    }) as typeof fetch;

    const pages = await listManagedFacebookPages({
      apiVersion: "v26.0",
      userAccessToken: "user-token-placeholder",
      fetchImpl,
    });
    expect(pages).toEqual([{ id: "42", name: "Página Teste", accessToken: "page-token-placeholder", tasks: ["CREATE_CONTENT"] }]);
  });

  it("blocks publication without explicit human confirmation before any HTTP request", async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    await expect(publishFacebookPageFeedPost({
      apiVersion: "v26.0",
      pageId: "42",
      pageAccessToken: "page-token-placeholder",
      message: "Conteúdo institucional",
      confirmedByHuman: false,
      fetchImpl,
    })).rejects.toThrow("confirmação humana");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("publishes only after explicit confirmation and keeps the Page token out of the body", async () => {
    const fetchImpl = vi.fn(async (_input: URL | RequestInfo, init?: RequestInit) => {
      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer page-token-placeholder");
      expect(String(init?.body)).not.toContain("page-token-placeholder");
      return new Response(JSON.stringify({ id: "42_99" }), { status: 200 });
    }) as typeof fetch;

    const result = await publishFacebookPageFeedPost({
      apiVersion: "v26.0",
      pageId: "42",
      pageAccessToken: "page-token-placeholder",
      message: "Conteúdo institucional",
      confirmedByHuman: true,
      fetchImpl,
    });
    expect(result.externalPostId).toBe("42_99");
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("sanitizes provider errors instead of exposing provider messages or tokens", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      error: { message: "provider detail with token-like text", type: "OAuthException", code: 190 },
    }), { status: 400 })) as typeof fetch;

    await expect(listManagedFacebookPages({
      apiVersion: "v26.0",
      userAccessToken: "sensitive-placeholder",
      fetchImpl,
    })).rejects.toThrow("HTTP 400, OAuthException, código 190");

    try {
      await listManagedFacebookPages({ apiVersion: "v26.0", userAccessToken: "sensitive-placeholder", fetchImpl });
    } catch (error) {
      expect(String(error)).not.toContain("provider detail");
      expect(String(error)).not.toContain("sensitive-placeholder");
    }
  });
});
