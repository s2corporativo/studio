import { describe, expect, it } from "vitest";
import { buildCreativeDirectorPrompt } from "./creativeDirector";
import { buildContentFingerprint } from "../shared/contentFingerprint";

describe("Creative Director", () => {
  it("leva o histórico recente e o score de repetição para a direção criativa", () => {
    const previous = buildContentFingerprint({
      title: "Auto de infração ambiental para empresas",
      area: "Ambiental",
      audience: "Empresas",
      objective: "Autoridade",
      format: "carousel",
      visualFamily: "information_system",
    });
    const prompt = buildCreativeDirectorPrompt({
      title: "Empresa recebeu auto de infração ambiental",
      area: "Ambiental",
      audience: "Empresas",
      objective: "Autoridade e comercial",
      format: "carousel",
      recentFingerprints: [previous],
    });
    expect(prompt.user).toContain("Maior similaridade estrutural");
    expect(prompt.user).toContain("Motivos sobreutilizados");
    expect(prompt.user).toContain("force mudança visível");
    expect(prompt.deterministicFamily.key.length).toBeGreaterThan(3);
  });
});
