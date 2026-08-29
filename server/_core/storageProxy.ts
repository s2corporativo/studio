import type { Express } from "express";
import { ENV } from "./env";
import { sdk } from "./sdk";

const STUDIO_STORAGE_PREFIX = "social-studio/";

export function isValidStudioKey(key: string) {
  if (!key.startsWith(STUDIO_STORAGE_PREFIX)) return false;
  if (key.includes("\\") || key.includes("\0")) return false;
  const segments = key.split("/");
  return segments.every(segment => segment !== ".." && segment !== ".");
}

export function safeRedirectUrl(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*key", async (req, res) => {
    const rawKey = (req.params as Record<string, string | string[] | undefined>).key;
    const key = Array.isArray(rawKey) ? rawKey.join("/") : rawKey;
    if (!key || !isValidStudioKey(key)) {
      res.status(400).send("Invalid storage key");
      return;
    }

    const isPrivateKnowledge = /(^|\/)conhecimento\//.test(key);
    if (isPrivateKnowledge) {
      try {
        const user = await sdk.authenticateRequest(req);
        if (!user) { res.status(401).send("Authentication required"); return; }
        const expectedPrefix = `social-studio/${user.id}/conhecimento/`;
        if (!key.startsWith(expectedPrefix)) { res.status(403).send("Forbidden"); return; }
      } catch {
        res.status(401).send("Authentication required");
        return;
      }
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        console.error(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "error",
          event: "storage_proxy.presign_failed",
          status: forgeResp.status,
        }));
        res.status(502).send("Storage backend error");
        return;
      }

      const payload = (await forgeResp.json()) as { url?: unknown };
      const redirectUrl = safeRedirectUrl(payload.url);
      if (!redirectUrl) {
        console.error(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "error",
          event: "storage_proxy.invalid_signed_url",
        }));
        res.status(502).send("Invalid signed URL from backend");
        return;
      }

      res.set("Cache-Control", "no-store");
      res.redirect(307, redirectUrl.toString());
    } catch (error) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        event: "storage_proxy.failed",
        errorType: error instanceof Error ? error.name : "UnknownError",
      }));
      res.status(502).send("Storage proxy error");
    }
  });
}
