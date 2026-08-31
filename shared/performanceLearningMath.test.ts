import { describe, expect, it } from "vitest";
import { confidenceForSampleSize, latestMetricSnapshots, percentageLift, performanceRates } from "./performanceLearningMath";

describe("performance learning math", () => {
  it("usa apenas o snapshot cumulativo mais recente por post e rede", () => {
    const rows = [
      { postId: 1, network: "instagram", impressions: 100, reach: 80, likes: 10, comments: 1, shares: 1, saves: 2, clicks: 3, leads: 0, capturedAt: new Date("2026-08-20") },
      { postId: 1, network: "instagram", impressions: 250, reach: 190, likes: 24, comments: 3, shares: 5, saves: 8, clicks: 9, leads: 2, capturedAt: new Date("2026-08-21") },
      { postId: 1, network: "facebook", impressions: 90, reach: 70, likes: 4, comments: 1, shares: 1, saves: 0, clicks: 1, leads: 0, capturedAt: new Date("2026-08-21") },
    ];
    const latest = latestMetricSnapshots(rows);
    expect(latest).toHaveLength(2);
    expect(latest.find(item => item.network === "instagram")?.reach).toBe(190);
  });

  it("calcula taxas sem divisão por zero", () => {
    expect(performanceRates({ reach: 0, likes: 10, comments: 2, shares: 1, saves: 1, clicks: 2, leads: 1 })).toEqual({ engagementRate: 0, actionRate: 0, saveShareRate: 0 });
  });

  it("não atribui confiança a amostra unitária e limita confiança máxima", () => {
    expect(confidenceForSampleSize(1)).toBe(0);
    expect(confidenceForSampleSize(2)).toBeGreaterThan(0);
    expect(confidenceForSampleSize(100)).toBe(92);
  });

  it("calcula lift interno sem inventar baseline quando ele é zero", () => {
    expect(percentageLift(0.15, 0.1)).toBe(50);
    expect(percentageLift(0.15, 0)).toBeNull();
  });
});
