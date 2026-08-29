import type { Express, Request, Response } from "express";
import { encryptExternalToken } from "./externalTokenCrypto";
import { exchangeFacebookAuthorizationCode, getFacebookPagesConfigFromEnv, listManagedFacebookPages } from "./facebookPagesApi";
import { getExternalOAuthOrigin, getFacebookRedirectUri } from "./externalOrigins";
import { verifyExternalOAuthState } from "./externalOAuthState";
import { chooseFacebookPage, upsertExternalConnection } from "./externalConnectionsDb";
import { getSocialProfile, updateSocialProfile } from "./socialStudioDb";
import { sdk } from "./_core/sdk";

function query(req: Request, key: string) {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function redirect(res: Response, origin: string, state: "connected" | "choose_page" | "denied" | "error") {
  res.redirect(302, `${origin}/redes?facebook=${state}`);
}

async function markFacebookProfileState(userId: number, profileId: number | null, state: "active" | "pending_oauth" | "connected" | "error", externalAccountId?: string | null) {
  if (profileId === null) return;
  const profile = await getSocialProfile(userId, profileId);
  if (profile.network !== "facebook") return;
  await updateSocialProfile(userId, profileId, {
    externalAccountId: externalAccountId === undefined ? profile.externalAccountId : externalAccountId,
    connectionMode: state === "active" ? profile.connectionMode : "oauth",
    state,
    verifiedAt: state === "connected" ? new Date() : profile.verifiedAt,
  });
}

export function registerFacebookOAuthRoutes(app: Express) {
  app.get("/api/facebook/oauth/callback", async (req: Request, res: Response) => {
    let origin = "";
    let state = null as ReturnType<typeof verifyExternalOAuthState>;
    try {
      origin = getExternalOAuthOrigin(req);
      const sessionUser = await sdk.authenticateRequest(req);
      const receivedState = query(req, "state");
      state = receivedState ? verifyExternalOAuthState(receivedState, "facebook") : null;
      if (!state || state.userId !== sessionUser.id || sessionUser.isCron) {
        res.status(403).send("A confirmação da conexão do Facebook expirou ou não pertence à sessão atual.");
        return;
      }

      if (query(req, "error")) {
        await markFacebookProfileState(sessionUser.id, state.profileId, "active");
        redirect(res, origin, "denied");
        return;
      }

      const code = query(req, "code");
      if (!code) {
        await markFacebookProfileState(sessionUser.id, state.profileId, "error");
        res.status(400).send("A Meta não retornou um código de autorização para o Facebook.");
        return;
      }

      const config = getFacebookPagesConfigFromEnv();
      if (!config) throw new Error("A integração do Facebook ainda não possui configuração completa no ambiente seguro.");
      const callbackUrl = getFacebookRedirectUri(req);
      const userToken = await exchangeFacebookAuthorizationCode({ config, redirectUri: callbackUrl, code });
      const pages = await listManagedFacebookPages({ apiVersion: config.apiVersion, userAccessToken: userToken.accessToken });
      if (pages.length === 0) throw new Error("Nenhuma Página administrada foi retornada pela Meta para esta autorização.");

      const profileId = state.profileId;
      if (profileId !== null) {
        const profile = await getSocialProfile(sessionUser.id, profileId);
        if (profile.network !== "facebook") throw new Error("O perfil selecionado não pertence ao Facebook.");
      }

      for (const page of pages) {
        await upsertExternalConnection(sessionUser.id, {
          socialProfileId: profileId,
          provider: "facebook",
          externalAccountId: page.id,
          accountName: page.name,
          accessTokenCiphertext: encryptExternalToken("facebook", page.accessToken),
          tokenExpiresAt: null,
          permissions: JSON.stringify(page.tasks),
          metadataJson: JSON.stringify({ source: "facebook_pages_oauth" }),
          state: pages.length === 1 ? "connected" : "pending",
          lastError: null,
          connectedAt: pages.length === 1 ? new Date() : null,
        });
      }

      if (pages.length === 1) {
        await chooseFacebookPage(sessionUser.id, pages[0].id);
        await markFacebookProfileState(sessionUser.id, profileId, "connected", pages[0].id);
        redirect(res, origin, "connected");
        return;
      }

      await markFacebookProfileState(sessionUser.id, profileId, "pending_oauth");
      redirect(res, origin, "choose_page");
    } catch (error) {
      if (state) {
        try { await markFacebookProfileState(state.userId, state.profileId, "error"); } catch { /* keep original error */ }
      }
      console.error("[Facebook OAuth] Callback failed", error instanceof Error ? error.message : "unknown");
      if (origin) redirect(res, origin, "error");
      else res.status(500).send("Não foi possível concluir a conexão com o Facebook.");
    }
  });
}
