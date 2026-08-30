import { describe, expect, it } from "vitest";
import { hasSimilarContent } from "./contentSimilarity";

describe("detector de repetição", () => {
  it("sinaliza tema, título e legenda com três ou mais palavras relevantes em comum", () => {
    expect(hasSimilarContent("Controle de jornada: falhas que geram passivo. Registros confiáveis reduzem risco.", "Controle de jornada: erros que geram passivo trabalhista. Registros confiáveis devem refletir a rotina.")).toMatchObject({ similar: true });
  });

  it("não bloqueia títulos com sobreposição insuficiente", () => {
    expect(hasSimilarContent("LGPD no RH", "Licenciamento ambiental preventivo")).toMatchObject({ similar: false });
  });
});
