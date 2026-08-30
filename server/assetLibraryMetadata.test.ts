import { describe, expect, it } from "vitest";
import { metadataForExistingAsset } from "./assetLibraryMetadata";

describe("metadados das artes importadas", () => {
  it("classifica uma arte individual por tema e área", () => {
    expect(metadataForExistingAsset("depaula_teixeira_instagram_novos_temas/post_21_pix_fraude.png")).toMatchObject({ area: "Consumidor", assetType: "single", groupKey: null });
  });

  it("preserva a sequência e o agrupamento de um carrossel", () => {
    expect(metadataForExistingAsset("depaula_teixeira_carrosseis_empresariais/carrossel_11_lgpd_rh/04_sensiveis.png")).toMatchObject({ area: "LGPD", assetType: "carousel_slide", groupKey: "carrossel_11_lgpd_rh", slideOrder: 4 });
  });

  it("rejeita arquivos fora do inventário controlado", () => {
    expect(() => metadataForExistingAsset("arte_desconhecida.png")).toThrow("sem metadados");
  });
});
