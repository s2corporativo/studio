import { protectedProcedure, router } from "../_core/trpc";
import { buildExternalIntegrationStatuses, getExternalIntegrationConfigFromEnv } from "../externalIntegrations";
import { getInstagramConnectionSummary } from "../socialStudioDb";

export const externalIntegrationsRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => {
    const instagramConnection = await getInstagramConnectionSummary(ctx.user.id);
    const integrations = buildExternalIntegrationStatuses(getExternalIntegrationConfigFromEnv(), instagramConnection);
    return {
      integrations,
      connectedCount: integrations.filter(item => item.connected).length,
      readyForOAuthCount: integrations.filter(item => item.state === "ready_for_oauth").length,
      blockedCount: integrations.filter(item => item.state === "awaiting_credentials" || item.state === "connector_planned" || item.state === "error").length,
    };
  }),
});
