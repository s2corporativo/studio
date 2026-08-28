import type { Express, Request, Response } from "express";
import { encryptInstagramToken } from "./instagramCrypto";
import { exchangeInstagramAuthorizationCode, getInstagramProfile } from "./instagramApi";
import { setInstagramConnectionError, setInstagramProfileConnectionState, upsertInstagramConnection } from "./socialStudioDb";
import { verifyInstagramOAuthState } from "./instagramOAuthState";
import { getInstagramOAuthOrigin, getInstagramRedirectUri } from "./instagramOrigins";
import { sdk } from "./_core/sdk";

function query(req: Request, key: string) {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function redirect(res: Response, origin: string, state: "connected" | "denied" | "error") {
  res.redirect(302, `${origin}/instagram?instagram=${state}`);
}

export async function completeInstagramOAuthConnection(userId: number, token: { instagramUserId: string; accessToken: string; expiresInSeconds: number; permissions: string | null }, profile: { id?: string | null; user_id?: string | null; username?: string | null }) {
  const connection = await upsertInstagramConnection(userId, {
    instagramUserId: profile.id ?? profile.user_id ?? token.instagramUserId,
    username: profile.username ?? null,
    accessTokenCiphertext: encryptInstagramToken(token.accessToken),
    tokenExpiresAt: new Date(Date.now() + token.expiresInSeconds * 1000),
    permissions: token.permissions,
    state: "connected",
    lastError: null,
    connectedAt: new Date(),
  });
  if (connection?.socialProfileId) await setInstagramProfileConnectionState(userId, connection.socialProfileId, "connected");
  return connection;
}

export async function failInstagramOAuthConnection(userId: number) {
  const connection = await setInstagramConnectionError(userId, "Não foi possível concluir a conexão com a Meta. Verifique as permissões e tente novamente.");
  if (connection?.socialProfileId) await setInstagramProfileConnectionState(userId, connection.socialProfileId, "error");
  return connection;
}

export function registerInstagramOAuthRoutes(app: Express) {
  app.get("/api/instagram/oauth/callback", async (req: Request, res: Response) => {
    let origin = "";
    try {
      origin = getInstagramOAuthOrigin(req);
      const sessionUser = await sdk.authenticateRequest(req);
      const receivedState = query(req, "state");
      const state = receivedState ? verifyInstagramOAuthState(receivedState) : null;
      if (!state || state.userId !== sessionUser.id || sessionUser.isCron) {
        res.status(403).send("A confirmação da conexão do Instagram expirou ou não pertence à sessão atual.");
        return;
      }
      const authorizationError = query(req, "error");
      if (authorizationError) {
        await setInstagramConnectionError(sessionUser.id, "A autorização da conta do Instagram foi recusada ou não concluída.");
        redirect(res, origin, "denied");
        return;
      }
      const code = query(req, "code");
      if (!code) {
        res.status(400).send("A Meta não retornou um código de autorização para a conta do Instagram.");
        return;
      }
      const callbackUrl = getInstagramRedirectUri(req);
      const token = await exchangeInstagramAuthorizationCode(code, callbackUrl);
      const profile = await getInstagramProfile(token.instagramUserId, token.accessToken);
      await completeInstagramOAuthConnection(sessionUser.id, token, profile);
      redirect(res, origin, "connected");
    } catch (error) {
      const state = query(req, "state") ? verifyInstagramOAuthState(query(req, "state")!) : null;
      if (state) await failInstagramOAuthConnection(state.userId);
      console.error("[Instagram OAuth] Callback failed", error instanceof Error ? error.message : "unknown");
      if (origin) redirect(res, origin, "error");
      else res.status(500).send("Não foi possível concluir a conexão com o Instagram.");
    }
  });
}
