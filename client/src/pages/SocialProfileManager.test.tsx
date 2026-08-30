import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ connection: { socialProfileId: 17, state: "pending" as string } }));
const mutation = { isPending: false, mutate: vi.fn() };

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ socialStudio: { socialProfiles: { invalidate: vi.fn() }, instagramData: { invalidate: vi.fn() }, data: { invalidate: vi.fn() } } }),
    socialStudio: {
      socialProfiles: { useQuery: () => ({ data: [{ id: 17, network: "instagram", displayName: "S2 Studio", handle: "depaulateixeira.adv", profileUrl: "https://www.instagram.com/depaulateixeira.adv/", externalAccountId: null, notes: null, state: "pending_oauth" }] }) },
      instagramData: { useQuery: () => ({ data: { connection: state.connection } }) },
      addSocialProfile: { useMutation: () => mutation },
      updateSocialProfile: { useMutation: () => mutation },
      removeSocialProfile: { useMutation: () => mutation },
      beginInstagramConnection: { useMutation: () => mutation },
    },
  },
}));

import SocialProfileManager from "./SocialProfileManager";

describe("SocialProfileManager", () => {
  it("renderiza o estado OAuth pendente da conexão vinculada", () => {
    state.connection = { socialProfileId: 17, state: "pending" };
    expect(renderToStaticMarkup(<SocialProfileManager />)).toContain("OAuth aguardando autorização");
  });

  it("renderiza os estados OAuth conectado e com erro, sem associá-los a outro perfil", () => {
    state.connection = { socialProfileId: 17, state: "connected" };
    expect(renderToStaticMarkup(<SocialProfileManager />)).toContain("OAuth conectado");
    state.connection = { socialProfileId: 17, state: "error" };
    expect(renderToStaticMarkup(<SocialProfileManager />)).toContain("OAuth exige atenção");
    state.connection = { socialProfileId: 99, state: "connected" };
    expect(renderToStaticMarkup(<SocialProfileManager />)).toContain("OAuth não associado a este perfil");
  });
});
