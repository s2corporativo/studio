import { protectedProcedure, router } from "../_core/trpc";
import { buildExternalIntegrationStatuses, getExternalIntegrationConfigFromEnv } from "../externalIntegrations";
import { getInstagramConnectionSummary } from "../socialStudioDb";
import { listExternalConnections } from "../externalConnectionsDb";

export const externalIntegrationsRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => {
    const [instagramConnection, facebookPages] = await Promise.all([
      getInstagramConnectionSummary(ctx.user.id),
      listExternalConnections(ctx.user.id, "facebook"),
    ]);
    const integrations = buildExternalIntegrationStatuses(getExternalIntegrationConfigFromEnv(), instagramConnection).map(item => {
      if (item.id !== "facebook") return item;
      const connected = facebookPages.some(page => page.state === "connected");
      const pending = facebookPages.some(page => page.state === "pending");
      return {
        ...item,
        connected,
        state: connected ? "connected" as const : pending ? "ready_for_oauth" as const : item.configured ? "configured_unvalidated" as const : "awaiting_credentials" as const,
        detail: connected
          ? "Página oficial conectada via OAuth. Publicação exige conteúdo aprovado e confirmação humana explícita."
          : pending
            ? "OAuth concluído. Escolha explicitamente qual Página administrada será usada pelo Studio."
            : item.configured
              ? "O conector de Facebook Pages está implementado, mas ainda falta validar o OAuth e selecionar a Página oficial."
              : "O conector de Facebook Pages está implementado e aguarda configuração protegida da aplicação Meta.",
        capabilities: { ...item.capabilities, oauth: true, publish: true, schedule: false, analytics: false },
      };
    });
    return {
      integrations,
      connectedCount: integrations.filter(item => item.connected).length,
      readyForOAuthCount: integrations.filter(item => item.state === "ready_for_oauth").length,
      blockedCount: integrations.filter(item => item.state === "awaiting_credentials" || item.state === "configured_unvalidated" || item.state === "connector_planned" || item.state === "error").length,
    };
  }),
});
