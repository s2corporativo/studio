import { describe, expect, it } from "vitest";
import { buildExternalIntegrationStatuses } from "./externalIntegrations";

describe("external integration readiness", () => {
  it("never reports an unconfigured connector as connected", () => {
    const statuses = buildExternalIntegrationStatuses({}, null);
    expect(statuses.every(item => item.connected === false)).toBe(true);
    expect(statuses.find(item => item.id === "instagram")?.state).toBe("awaiting_credentials");
    expect(statuses.find(item => item.id === "facebook")?.state).toBe("awaiting_credentials");
  });

  it("reports Instagram as ready for OAuth only when protected app configuration exists", () => {
    const statuses = buildExternalIntegrationStatuses({ metaInstagramAppId: "app-id", metaInstagramAppSecret: "secret" }, { state: "pending", lastError: null });
    const instagram = statuses.find(item => item.id === "instagram");
    expect(instagram?.state).toBe("ready_for_oauth");
    expect(instagram?.connected).toBe(false);
    expect(instagram?.missingConfiguration).toEqual([]);
  });

  it("reports Instagram as connected only from the persisted official connection state", () => {
    const statuses = buildExternalIntegrationStatuses({ metaInstagramAppId: "app-id", metaInstagramAppSecret: "secret" }, { state: "connected", lastError: null });
    const instagram = statuses.find(item => item.id === "instagram");
    expect(instagram?.state).toBe("connected");
    expect(instagram?.connected).toBe(true);
  });

  it("does not claim unsupported connectors are operational just because credentials exist", () => {
    const statuses = buildExternalIntegrationStatuses({ linkedinClientId: "client", linkedinClientSecret: "secret" }, null);
    const linkedin = statuses.find(item => item.id === "linkedin");
    expect(linkedin?.configured).toBe(true);
    expect(linkedin?.state).toBe("connector_planned");
    expect(linkedin?.capabilities.oauth).toBe(false);
    expect(linkedin?.capabilities.publish).toBe(false);
  });

  it("never exposes credential values in the returned readiness payload", () => {
    const secret = "super-secret-value";
    const statuses = buildExternalIntegrationStatuses({ metaInstagramAppId: "app", metaInstagramAppSecret: secret }, null);
    expect(JSON.stringify(statuses)).not.toContain(secret);
    expect(JSON.stringify(statuses)).toContain("META_FACEBOOK_APP_ID");
  });
});
