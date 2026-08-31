import { describe, expect, it } from "vitest";
import { antiRepetitionDirective, compositionDirectiveFor, visualCompositionFamilies } from "./visualRepetition";

describe("visual repetition control", () => {
  it("is deterministic for the same topic", () => {
    expect(compositionDirectiveFor("Ambiental|Licenciamento")).toEqual(compositionDirectiveFor("Ambiental|Licenciamento"));
  });

  it("spreads a representative topic set across multiple composition families", () => {
    const topics = ["Pix", "Rescisão", "Licenciamento", "Contrato empresarial", "LGPD no RH", "Reforma tributária", "Intimação policial", "Acidente de trabalho"];
    const families = new Set(topics.map(compositionDirectiveFor).map(item => item.key));
    expect(families.size).toBeGreaterThanOrEqual(3);
    expect(families.size).toBeLessThanOrEqual(visualCompositionFamilies.length);
  });

  it("explicitly discourages recurring legal props", () => {
    const directive = antiRepetitionDirective();
    expect(directive).toContain("magnifying glass");
    expect(directive).toContain("AI templates");
  });
});
