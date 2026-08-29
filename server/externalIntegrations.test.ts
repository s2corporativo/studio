import { describe, expect, it } from "vitest";
import { buildExternalIntegrationStatuses } from "./externalIntegrations";

describe("external integration readiness", () => {
  it("never reports an unconfigured connector as connected", () => {
    const statuses = buildExternalIntegrationStatuses({}, null);
    expect(statuses.every(item => item.connected === false)).toBe(true);
    expect(statuses.find(item => item.id === "instagram")?.state).toBe("awaiting_credentials");
    expect(statuses.find(item => item.id === "facebook")?.state).toBe("awaiting_credentials");
  });

  it("does not treat protected Instagram configuration as externally validated", () => {
    const statuses = buildExternalIntegrationStatuses({ metaInstagramAppId: "configured-id", metaInstagramAppSecret: "configured-value" }, null);
    const instagram = statuses.find(item => item.id === "instagram");
    expect(instagram?.state).toBe("configured_unvalidated");
    expect(instagram?.connected).toBe(false);
  });

  it("reports Instagram connected only from the persisted official state", () => {
    const statuses = buildExternalIntegrationStatuses({ metaInstagramAppId: "configured-id", metaInstagramAppSecret: "configured-value" }, { state: "connected", lastError: null });
    expect(statuses.find(item => item.id === "instagram")?.state).toBe("connected");
  });

  it("treats expired Instagram authorization as reconnect-required", () => {
    const statuses = buildExternalIntegrationStatuses({ metaInstagramAppId: "configured-id", metaInstagramAppSecret: "configured-value" }, { state: "expired", lastError: null });
    const instagram = statuses.find(item => item.id === "instagram");
    expect(instagram?.state).toBe("error");
    expect(instagram?.connected).toBe(false);
  });

  it("does not claim unsupported connectors are operational from configuration alone", () => {
    const statuses = buildExternalIntegrationStatuses({ linkedinClientId: "configured-id", linkedinClientSecret: "configured-value" }, null);
    const linkedin = statuses.find(item => item.id === "linkedin");
    expect(linkedin?.state).toBe("connector_planned");
    expect(linkedin?.capabilities.publish).toBe(false);
  });

  it("does not return protected configuration values", () => {
    const protectedValue = "protected-placeholder-value";
    const statuses = buildExternalIntegrationStatuses({ metaInstagramAppId: "configured-id", metaInstagramAppSecret: protectedValue }, null);
    expect(JSON.stringify(statuses)).not.toContain(protectedValue);
  });
});
