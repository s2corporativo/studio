import { describe, expect, it } from "vitest";
import { calculatePrePublicationScore } from "./prePublication";

describe("score pré-publicação", () => {
  it("atribui nota máxima somente quando todos os controles estiverem completos", () => {
    expect(calculatePrePublicationScore({
      title: "Controle de jornada exige método",
      hook: "Um registro confiável evita risco silencioso.",
      caption: "Conteúdo informativo para empresas sobre jornada, evidências e rotina preventiva, com texto suficiente para análise de clareza e leitura.",
      cta: "Conheça as áreas e canais oficiais.",
      sourceId: 1,
      legalSource: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm",
      keyStatement: "A gestão de jornada deve refletir a rotina efetiva.",
      reviewDueAt: new Date(),
      mediaUrl: "https://example.com/arte.png",
      prohibitedTerms: "causa ganha, resultado garantido",
    })).toEqual({ score: 100, passed: ["clareza", "CTA", "compliance OAB", "legibilidade", "risco regulatório"], pending: [] });
  });

  it("identifica o risco regulatório quando falta fonte vinculada ou revisão", () => {
    const result = calculatePrePublicationScore({ title: "Tema", hook: "Gancho", caption: "Uma legenda curta, mas que possui a quantidade necessária de caracteres para passar no critério de legibilidade do sistema.", cta: "Saiba mais" });
    expect(result.score).toBe(80);
    expect(result.pending).toEqual(["risco regulatório"]);
  });
});
