import { describe, expect, it } from "vitest";
import { scoreEditorialPotential } from "./editorialScoring";

describe("editorial potential scoring", () => {
  it("eleva intenção comercial em temas de dor concreta empresarial", () => {
    const score = scoreEditorialPotential({
      title: "Empresa recebeu auto de infração ambiental",
      hook: "Fiscalização exige resposta organizada e documentação",
      area: "Ambiental",
      audience: "Empresas e gestores",
      format: "carousel",
      sourceUrl: "https://www.gov.br/exemplo",
    });
    expect(score.commercialIntentScore).toBeGreaterThanOrEqual(60);
    expect(score.authorityScore).toBeGreaterThanOrEqual(60);
    expect(score.methodology).toBe("heuristic_not_outcome_prediction");
  });

  it("não trata curiosidade genérica como intenção comercial alta", () => {
    const score = scoreEditorialPotential({ title: "Curiosidade sobre símbolos do Direito", audience: "Público geral", format: "post" });
    expect(score.commercialIntentScore).toBeLessThan(50);
  });
});
