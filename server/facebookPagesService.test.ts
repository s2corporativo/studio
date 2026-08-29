import { describe, expect, it } from "vitest";
import { isUncertainExternalOutcome } from "./facebookPagesService";

describe("Facebook publication outcome classification", () => {
  it("quarantines transport failures with unknown external outcome", () => {
    expect(isUncertainExternalOutcome(new TypeError("network unavailable"))).toBe(true);
    expect(isUncertainExternalOutcome(new DOMException("timed out", "TimeoutError"))).toBe(true);
    expect(isUncertainExternalOutcome(new DOMException("aborted", "AbortError"))).toBe(true);
  });

  it("keeps explicit provider rejections retry-classifiable", () => {
    expect(isUncertainExternalOutcome(new Error("Meta Graph API recusou a operação (HTTP 400, código 190)."))).toBe(false);
  });
});
