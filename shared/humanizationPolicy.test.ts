import { describe, expect, it } from "vitest";
import { assessHumanizationMix, inferHumanizationCategory } from "./humanizationPolicy";

describe("humanization policy", () => {
  it("recomenda presença humana quando o calendário está dominado por design", () => {
    const result = assessHumanizationMix(Array.from({ length: 10 }, () => ({ category: "graphic_design" as const })));
    expect(["video", "human_photo", "behind_scenes"]).toContain(result.nextRecommendedCategory);
    expect(result.humanPresencePercent).toBe(0);
  });

  it("classifica reels como vídeo e bastidores como bastidores", () => {
    expect(inferHumanizationCategory({ format: "reel", title: "Tema técnico" })).toBe("video");
    expect(inferHumanizationCategory({ format: "post", contentPillar: "Bastidores do escritório" })).toBe("behind_scenes");
  });
});
