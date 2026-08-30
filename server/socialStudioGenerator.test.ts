import { describe, expect, it } from "vitest";
import { buildLegalDraftPrompt } from "./socialStudioGenerator";

describe("buildLegalDraftPrompt", () => {
  it("preserves specific audience while including the bound brand context", () => {
    const prompt = buildLegalDraftPrompt({
      area: "Trabalhista",
      topic: "Controle de jornada",
      audience: "Gestores de RH",
      format: "carousel",
      objective: "Autoridade técnica",
      legalSource: "https://www.planalto.gov.br/",
      primaryCta: "Conheça os canais oficiais.",
      toneOfVoice: "Técnico e sóbrio",
      prohibitedTerms: "causa ganha, resultado garantido",
      brandName: "Marca B",
      brandPositioning: "Prevenção jurídica empresarial",
      brandAudience: "Empresas e gestores",
    });

    expect(prompt).toContain("Marca: Marca B");
    expect(prompt).toContain("Prevenção jurídica empresarial");
    expect(prompt).toContain("Público geral da marca: Empresas e gestores");
    expect(prompt).toContain("Público específico desta peça: Gestores de RH");
    expect(prompt).toContain("causa ganha, resultado garantido");
    expect(prompt).toContain("https://www.planalto.gov.br/");
  });

  it("does not invent missing brand context", () => {
    const prompt = buildLegalDraftPrompt({
      area: "Consumidor",
      topic: "Cobrança indevida",
      audience: "Consumidores",
      format: "post",
      objective: "Educação",
    });

    expect(prompt).toContain("Marca: não informada");
    expect(prompt).toContain("Posicionamento/objetivo declarado da marca: não informado");
    expect(prompt).toContain("Fonte jurídica recebida: nenhuma");
  });
});
