import { describe, expect, it } from "vitest";
import { buildExternalIntegrationStatuses } from "./externalIntegrations";

describe("external integration readiness", () => {
  it("never reports an unconfigured connector as connected", () => {
    const statuses = buildExternalIntegrationStatuses({}, null);
    expect(statuses.every(item => item.connected === false)).toBe(true);
    expect(statuses.find(item => item.id === "instagram")?.state).toBe("awaiting_credentials");
    expect(statuses.find(item => item.id === "facebook")?.state).toBe("awaiting_credentials");
  });

  it("does not treat protected Instagram variables as externally validated by themselves", () => {
    const statuses = buildExternalIntegrationStatuses({ metaInstagramAppId: "configured-id", metaInstagramAppSecret: "configured-value" }, null);
    const instagram = statuses.find(item => item.id === "instagram");
    expect(instagram?.state).toBe("configured_unvalidated");
    expect(instagram?.connected).toBe(false);
    expect(instagram?.missingConfiguration).toEqual([]);
  });

  it("reports Instagram as ready for OAuth only after the persisted connection enters pending state", () => {
    const statuses = buildExternalIntegrationStatuses({ metaInstagramAppId: "configured-id", metaInstagramAppSecret: "configured-value" }, { state: "pending", lastError: null });
    const instagram = statuses.find(item => item.id === "instagram");
    expect(instagram?.state).toBe("ready_for_oauth");
    expect(instagram?.connected).toBe(false);
  });

  it("reports Instagram as connected only from the persisted official connection state", () => {
    const statuses = buildExternalIntegrationStatuses({ metaInstagramAppId: "configured-id", metaInstagramAppSecret: "configured-value" }, { state: "connected", lastError: null });
    const instagram = statuses.find(item => item.id === "instagram");
    expect(instagram?.state).toBe("connected");
    expect(instagram?.connected).toBe(true);
  });

  it("does not expose a persisted provider error detail", () => {
    const detail = "provider-detail-placeholder";
    const statuses = buildExternalIntegrationStatuses({ metaInstagramAppId: "configured-id", metaInstagramAppSecret: "configured-value" }, { state: "error", lastError: detail });
    const instagram = statuses.find(item => item.id === "instagram");
    expect(instagram?.state).toBe("error");
    expect(JSON.stringify(instagram)).not.toContain(detail);
  });

  it("does not claim unsupported connectors are operational just because configuration exists", () => {
    const statuses = buildExternalIntegrationStatuses({ linkedinClientId: "configured-id", linkedinClientSecret: "configured-value" }, null);
    const linkedin = statuses.find(item => item.id === "linkedin");
    expect(linkedin?.configured).toBe(true);
    expect(linkedin?.state).toBe("connector_planned");
    expect(linkedin?.capabilities.oauth).toBe(false);
    expect(linkedin?.capabilities.publish).toBe(false);
  });

  it("does not return protected configuration values", () => {
    const protectedValue = "protected-placeholder-value";
    const statuses = buildExternalIntegrationStatuses({ metaInstagramAppId: "configured-id", metaInstagramAppSecret: protectedValue }, null);
    expect(JSON.stringify(statuses)).not.toContain(protectedValue);
    expect(JSON.stringify(statuses)).toContain("META_FACEBOOK_APP_ID");
  });
});
