import { describe, expect, it } from "vitest";
import { profileConnectionMode, publicSocialProfileHandle, publicSocialProfileUrl, socialNetworkInput } from "./socialProfilePolicy";

describe("política de perfis sociais externos", () => {
  it("aceita somente as redes explicitamente suportadas", () => {
    expect(socialNetworkInput.parse("instagram")).toBe("instagram");
    expect(() => socialNetworkInput.parse("x")).toThrow();
  });

  it("aceita URL pública HTTPS e bloqueia HTTP", () => {
    expect(publicSocialProfileUrl.parse("https://www.instagram.com/depaulateixeira.adv/")).toContain("https://");
    expect(() => publicSocialProfileUrl.parse("http://example.com/perfil")).toThrow("HTTPS");
  });

  it("normaliza o identificador público sem registrar marcador repetido", () => {
    expect(publicSocialProfileHandle.parse("@@depaulateixeira.adv")).toBe("depaulateixeira.adv");
    expect(publicSocialProfileHandle.parse("  ")).toBeNull();
  });

  it("informa que somente o Instagram possui caminho OAuth preparado", () => {
    expect(profileConnectionMode("instagram")).toBe("oauth_available");
    expect(profileConnectionMode("linkedin")).toBe("manual_reference");
  });
});
