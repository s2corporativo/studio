import { describe, expect, it } from "vitest";
import { evaluateOabCompliance } from "./compliance";

describe("evaluateOabCompliance", () => {
  it("bloqueia promessa explícita de resultado", () => {
    const issues = evaluateOabCompliance({ caption: "Causa ganha: garantimos resultado certo." });
    expect(issues.some(issue => issue.severity === "block" && issue.id === "promise")).toBe(true);
  });

  it("bloqueia captação direta", () => {
    const issues = evaluateOabCompliance({ cta: "Contrate agora nosso escritório." });
    expect(issues.some(issue => issue.severity === "block" && issue.id === "direct_solicitation")).toBe(true);
  });

  it("gera alerta para referência a caso concreto", () => {
    const issues = evaluateOabCompliance({ caption: "Caso real: conseguimos a revisão pretendida." });
    expect(issues.some(issue => issue.severity === "warning" && issue.id === "case_result")).toBe(true);
  });

  it("respeita termos proibidos configurados pela marca", () => {
    const issues = evaluateOabCompliance({ caption: "Atendimento premium", prohibitedTerms: "premium" });
    expect(issues.some(issue => issue.severity === "block" && issue.id.startsWith("brand-term:"))).toBe(true);
  });

  it("não bloqueia texto informativo sóbrio", () => {
    const issues = evaluateOabCompliance({
      title: "Entenda uma decisão recente do STJ",
      caption: "Conteúdo informativo baseado em fonte oficial. Consulte o contexto completo antes de aplicar ao seu caso.",
    });
    expect(issues.filter(issue => issue.severity === "block")).toHaveLength(0);
  });
});
