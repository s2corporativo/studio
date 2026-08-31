import { describe, expect, it } from "vitest";
import { buildContentFingerprint, fingerprintSimilarity, highestSimilarity } from "./contentFingerprint";

describe("content fingerprint", () => {
  it("detecta repetição estrutural forte sem depender de texto idêntico", () => {
    const a = buildContentFingerprint({
      title: "Empresa recebeu auto de infração ambiental",
      hook: "O prazo para reagir exige organização documental",
      area: "Ambiental",
      audience: "Empresas e gestores",
      objective: "Conversão comercial com autoridade técnica",
      format: "carousel",
      visualFamily: "information_system",
      visualObjects: ["documentos", "linha do tempo"],
      cta: "Fale conosco pelo WhatsApp",
      tone: "técnico",
    });
    const b = buildContentFingerprint({
      title: "Auto de infração ambiental: como organizar a resposta da empresa",
      hook: "Documentos e prazos devem ser tratados com método",
      area: "Ambiental",
      audience: "Empresas e gestores",
      objective: "Comercial e autoridade",
      format: "carousel",
      visualFamily: "information_system",
      visualObjects: ["linha do tempo", "documentos"],
      cta: "Entre em contato pelo WhatsApp",
      tone: "técnico",
    });
    const result = fingerprintSimilarity(a, b);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.reasons).toContain("visualFamily");
    expect(result.reasons).toContain("visualObjects");
  });

  it("reduz o score quando formato, intenção e direção visual mudam", () => {
    const a = buildContentFingerprint({ title: "Fraude no Pix", area: "Consumidor", audience: "Pessoa física", objective: "Educação", format: "post", visualFamily: "material_editorial", cta: "Salve este conteúdo" });
    const b = buildContentFingerprint({ title: "Bastidores do escritório", area: "Institucional", audience: "Comunidade", objective: "Relacionamento", format: "reel", visualFamily: "human_workplace", cta: "Conte sua dúvida" });
    expect(fingerprintSimilarity(a, b).score).toBeLessThan(35);
  });

  it("encontra o item mais parecido do histórico", () => {
    const candidate = buildContentFingerprint({ title: "Reforma tributária para empresas", area: "Tributário", audience: "Empresas", objective: "Autoridade", format: "carousel", visualFamily: "information_system" });
    const history = [
      buildContentFingerprint({ title: "Pensão alimentícia", area: "Família", audience: "Pessoa física", objective: "Educação", format: "post", visualFamily: "human_workplace" }),
      buildContentFingerprint({ title: "Reforma tributária: pontos de atenção para empresas", area: "Tributário", audience: "Empresas", objective: "Autoridade técnica", format: "carousel", visualFamily: "information_system" }),
    ];
    const result = highestSimilarity(candidate, history);
    expect(result.index).toBe(1);
    expect(result.score).toBeGreaterThan(50);
  });
});
