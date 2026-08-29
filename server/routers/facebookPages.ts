import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { buildFacebookPagesAuthorizationUrl, getFacebookPagesConfigFromEnv } from "../facebookPagesApi";
import { createExternalOAuthState } from "../externalOAuthState";
import { getFacebookRedirectUri } from "../externalOrigins";
import { chooseFacebookPage, listExternalConnections } from "../externalConnectionsDb";
import { getSocialProfile, updateSocialProfile } from "../socialStudioDb";
import { confirmAndPublishFacebookJob, requestFacebookPublication, testConnectedFacebookPage } from "../facebookPagesService";
import { recordAuditEvent } from "../socialOsDb";

export const facebookPagesRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => ({ configured: Boolean(getFacebookPagesConfigFromEnv()), pages: await listExternalConnections(ctx.user.id, "facebook") })),
  beginConnection: protectedProcedure.input(z.object({ profileId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const config = getFacebookPagesConfigFromEnv(); if (!config) throw new Error("A integração do Facebook ainda não possui App ID, App Secret e versão da Graph API configurados no ambiente seguro.");
    const profile = await getSocialProfile(ctx.user.id, input.profileId); if (profile.network !== "facebook") throw new Error("Selecione um perfil do Facebook para iniciar a conexão."); if (profile.state === "inactive") throw new Error("Ative o perfil do Facebook antes de iniciar a conexão.");
    const redirectUri = getFacebookRedirectUri(ctx.req); const state = createExternalOAuthState(ctx.user.id, "facebook", profile.id); const authorizationUrl = buildFacebookPagesAuthorizationUrl({ appId: config.appId, apiVersion: config.apiVersion, redirectUri, state });
    await updateSocialProfile(ctx.user.id, profile.id, { connectionMode: "oauth", state: "pending_oauth" }); await recordAuditEvent(ctx.user.id, "facebook.oauth.started", "social_profile", profile.id, { redirectUri }); return { authorizationUrl, redirectUri };
  }),
  selectPage: protectedProcedure.input(z.object({ pageId: z.string().regex(/^[0-9]+$/) })).mutation(async ({ ctx, input }) => {
    const connection = await chooseFacebookPage(ctx.user.id, input.pageId); if (connection.socialProfileId) { const profile = await getSocialProfile(ctx.user.id, connection.socialProfileId); await updateSocialProfile(ctx.user.id, profile.id, { externalAccountId: connection.externalAccountId, connectionMode: "oauth", state: "connected", verifiedAt: new Date() }); }
    await recordAuditEvent(ctx.user.id, "facebook.page.selected", "external_connection", connection.id, { pageId: connection.externalAccountId }); return connection;
  }),
  testConnection: protectedProcedure.mutation(({ ctx }) => testConnectedFacebookPage(ctx.user.id)),
  requestPublication: protectedProcedure.input(z.object({ postId: z.number().int().positive(), link: z.string().url().nullable().optional() })).mutation(({ ctx, input }) => requestFacebookPublication({ userId: ctx.user.id, postId: input.postId, link: input.link ?? null })),
  confirmPublication: protectedProcedure.input(z.object({ jobId: z.number().int().positive(), confirmedByHuman: z.literal(true) })).mutation(({ ctx, input }) => confirmAndPublishFacebookJob({ userId: ctx.user.id, jobId: input.jobId, confirmedByHuman: input.confirmedByHuman })),
});
