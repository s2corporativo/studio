import { describe, expect, it } from "vitest";
import { buildCampaignSlots, localDateTimeToUtc } from "./socialOsCampaign";

describe("Social OS campaign scheduling", () => {
  it("converts Sao Paulo local time to UTC without server timezone dependence", () => {
    const date = localDateTimeToUtc(2026, 8, 31, 18, 30, "America/Sao_Paulo");
    expect(date.toISOString()).toBe("2026-08-31T21:30:00.000Z");
  });

  it("distributes weekly posts across the whole horizon", () => {
    const slots = buildCampaignSlots({
      startDate: new Date("2026-08-31T12:00:00.000Z"),
      days: 30,
      postsPerWeek: 3,
      publishTime: "18:30",
      weekdaysOnly: true,
      timezone: "America/Sao_Paulo",
    });
    expect(slots.length).toBe(13);
    expect(slots[0].getTime()).toBeLessThan(slots.at(-1)!.getTime());
    expect(slots.at(-1)!.getTime() - slots[0].getTime()).toBeGreaterThan(20 * 24 * 60 * 60 * 1000);
  });

  it("never selects weekends when weekday cadence is enabled", () => {
    const slots = buildCampaignSlots({
      startDate: new Date("2026-08-31T12:00:00.000Z"),
      days: 15,
      postsPerWeek: 5,
      publishTime: "09:00",
      weekdaysOnly: true,
      timezone: "America/Sao_Paulo",
    });
    const weekdays = slots.map(slot => new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", weekday: "short" }).format(slot));
    expect(weekdays).not.toContain("Sat");
    expect(weekdays).not.toContain("Sun");
  });
});
