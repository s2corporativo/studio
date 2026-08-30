import { describe, expect, it } from "vitest";
import { instagramOAuthCardState, profileStateForInstagramConnection } from "./instagramProfileConnection";

describe("estado vinculado do perfil de Instagram", () => {
  it("mapeia a transição de conexão pendente, concluída e com erro para o perfil", () => {
    expect(profileStateForInstagramConnection("pending")).toBe("pending_oauth");
    expect(profileStateForInstagramConnection("connected")).toBe("connected");
    expect(profileStateForInstagramConnection("error")).toBe("error");
  });

  it("exibe o estado oficial somente no perfil vinculado", () => {
    expect(instagramOAuthCardState(10, null)).toEqual({ linked: false, label: "OAuth não associado a este perfil" });
    expect(instagramOAuthCardState(10, { socialProfileId: 10, state: "pending" })).toEqual({ linked: true, label: "OAuth aguardando autorização" });
    expect(instagramOAuthCardState(10, { socialProfileId: 10, state: "connected" })).toEqual({ linked: true, label: "OAuth conectado" });
    expect(instagramOAuthCardState(10, { socialProfileId: 10, state: "error" })).toEqual({ linked: true, label: "OAuth exige atenção" });
    expect(instagramOAuthCardState(11, { socialProfileId: 10, state: "connected" })).toEqual({ linked: false, label: "OAuth não associado a este perfil" });
  });
});
