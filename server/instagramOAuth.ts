import type { Express, Request, Response } from "express";
import { encryptInstagramToken } from "./instagramCrypto";
import { exchangeInstagramAuthorizationCode, getInstagramProfile } from "./instagramApi";
import { setInstagramConnectionError, upsertInstagramConnection } from "./socialStudioDb";
import { verifyInstagramOAuthState } from "./instagramOAuthState";
import { sdk } from "./_core/sdk";

function query(req: Request, key: string) {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function requestOrigin(req: Request) {
  const forwardedHost = req.get("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const forwardedProto = req.get("x-forwarded-proto")?.split(",")[0];
  const protocol = forwardedProto || req.protocol || "https";
  if (!host) throw new Error("Não foi possível determinar o endereço de retorno da aplicação.");
  return new URL(`${protocol}://${host}`).origin;
}

function redirect(res: Response, origin: string, state: "connected" | "denied" | "error") {
  res.redirect(302, `${origin}/instagram?instagram=${state}`);
}

export function registerInstagramOAuthRoutes(app: Express) {
  app.get("/api/instagram/oauth/callback", async (req: Request, res: Response) => {
    let origin = "";
    try {
      origin = requestOrigin(req);
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
      const callbackUrl = `${origin}/api/instagram/oauth/callback`;
      const token = await exchangeInstagramAuthorizationCode(code, callbackUrl);
      const profile = await getInstagramProfile(token.instagramUserId, token.accessToken);
      await upsertInstagramConnection(sessionUser.id, {
        instagramUserId: profile.id ?? profile.user_id ?? token.instagramUserId,
        username: profile.username ?? null,
        accessTokenCiphertext: encryptInstagramToken(token.accessToken),
        tokenExpiresAt: new Date(Date.now() + token.expiresInSeconds * 1000),
        permissions: token.permissions,
        state: "connected",
        lastError: null,
        connectedAt: new Date(),
      });
      redirect(res, origin, "connected");
    } catch (error) {
      const state = query(req, "state") ? verifyInstagramOAuthState(query(req, "state")!) : null;
      if (state) await setInstagramConnectionError(state.userId, "Não foi possível concluir a conexão com a Meta. Verifique as permissões e tente novamente.");
      console.error("[Instagram OAuth] Callback failed", error instanceof Error ? error.message : "unknown");
      if (origin) redirect(res, origin, "error");
      else res.status(500).send("Não foi possível concluir a conexão com o Instagram.");
    }
  });
}
