import { describe, expect, it } from "vitest";
import { calculateRadarValidity, canUseRadarItemWithoutDateReview } from "./radarFreshness";

describe("radar freshness", () => {
  const now = new Date("2026-08-29T20:00:00-03:00");

  it("marca notícia recente como fresh", () => {
    const validity = calculateRadarValidity({ source: "STJ Notícias", publishedAt: "2026-08-28T18:00:00-03:00", consultedAt: now });
    expect(validity.freshnessStatus).toBe("fresh");
    expect(canUseRadarItemWithoutDateReview(validity)).toBe(true);
  });

  it("expira notícia antiga", () => {
    const validity = calculateRadarValidity({ source: "TST Notícias", publishedAt: "2026-08-01T12:00:00-03:00", consultedAt: now });
    expect(validity.freshnessStatus).toBe("expired");
    expect(canUseRadarItemWithoutDateReview(validity)).toBe(false);
  });

  it("exige revisão de data quando a fonte não informa publicação", () => {
    const validity = calculateRadarValidity({ source: "STF Notícias", publishedAt: null, consultedAt: now });
    expect(validity.freshnessStatus).toBe("needs_date_verification");
    expect(validity.ttlDays).toBe(2);
    expect(canUseRadarItemWithoutDateReview(validity)).toBe(false);
  });
});
