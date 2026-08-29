import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { socialStudioRouter } from "./routers/socialStudio";
import { socialOsRouter } from "./routers/socialOs";
import { socialGovernanceRouter } from "./routers/socialGovernance";
import { socialCampaignRouter } from "./routers/socialCampaign";
import { socialGrowthRouter } from "./routers/socialGrowth";
import { socialIntelligenceRouter } from "./routers/socialIntelligence";
import { socialAutomationRouter } from "./routers/socialAutomation";
import { brandGuardianRouter } from "./routers/brandGuardian";
import { knowledgeSecurityRouter } from "./routers/knowledgeSecurity";
import { instagramIntegrityRouter } from "./routers/instagramIntegrity";
import { externalIntegrationsRouter } from "./routers/externalIntegrations";
import { facebookPagesRouter } from "./routers/facebookPages";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  socialStudio: socialStudioRouter,
  socialOs: socialOsRouter,
  socialGovernance: socialGovernanceRouter,
  socialCampaign: socialCampaignRouter,
  socialGrowth: socialGrowthRouter,
  socialIntelligence: socialIntelligenceRouter,
  socialAutomation: socialAutomationRouter,
  brandGuardian: brandGuardianRouter,
  knowledgeSecurity: knowledgeSecurityRouter,
  instagramIntegrity: instagramIntegrityRouter,
  externalIntegrations: externalIntegrationsRouter,
  facebookPages: facebookPagesRouter,
});

export type AppRouter = typeof appRouter;
