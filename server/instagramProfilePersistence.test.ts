import { beforeEach, describe, expect, it, vi } from "vitest";
import { instagramConnections, socialProfiles } from "../drizzle/schema";

type StoredProfile = { id: number; userId: number; network: "instagram"; state: string; handle: string | null; displayName: string; profileUrl: string; externalAccountId: string | null; notes: string | null };
let profile: StoredProfile;
let connection: Record<string, unknown> | null;

const db = {
  select: () => ({
    from: (table: unknown) => ({
      where: () => ({
        limit: async () => table === socialProfiles ? [profile] : table === instagramConnections ? (connection ? [connection] : []) : [],
      }),
    }),
  }),
  insert: (table: unknown) => ({
    values: async (values: Record<string, unknown>) => {
      if (table === instagramConnections) connection = { id: 91, ...values };
      return [{ insertId: 91 }];
    },
  }),
  update: (table: unknown) => ({
    set: (values: Record<string, unknown>) => ({
      where: async () => {
        if (table === socialProfiles) Object.assign(profile, values);
        if (table === instagramConnections && connection) Object.assign(connection, values);
      },
    }),
  }),
};

vi.mock("./db", () => ({ getDb: vi.fn(async () => db) }));

import { linkInstagramProfileToConnection, setInstagramProfileConnectionState, upsertInstagramConnection } from "./socialStudioDb";

describe("persistência do vínculo OAuth de Instagram", () => {
  beforeEach(() => {
    profile = { id: 17, userId: 5, network: "instagram", state: "active", handle: "s2studio.adv", displayName: "S2 Studio", profileUrl: "https://www.instagram.com/s2studio.adv/", externalAccountId: null, notes: null };
    connection = null;
  });

  it("persiste perfil e conexão no estado inicial pendente", async () => {
    await linkInstagramProfileToConnection(5, 17);

    expect(connection).toMatchObject({ userId: 5, socialProfileId: 17, state: "pending", username: "s2studio.adv" });
    expect(profile.state).toBe("pending_oauth");
  });

  it("mantém o vínculo persistido ao avançar de pendente para conectado ou erro", async () => {
    await linkInstagramProfileToConnection(5, 17);
    await upsertInstagramConnection(5, { socialProfileId: 17, instagramUserId: "ig-1", username: "s2studio.adv", accessTokenCiphertext: "cipher", tokenExpiresAt: null, permissions: null, state: "connected", lastError: null, connectedAt: new Date() });
    await setInstagramProfileConnectionState(5, 17, "connected");

    expect(connection).toMatchObject({ socialProfileId: 17, state: "connected" });
    expect(profile.state).toBe("connected");

    await upsertInstagramConnection(5, { socialProfileId: 17, instagramUserId: "ig-1", username: "s2studio.adv", accessTokenCiphertext: "cipher", tokenExpiresAt: null, permissions: null, state: "error", lastError: "Permissão recusada", connectedAt: new Date() });
    await setInstagramProfileConnectionState(5, 17, "error");

    expect(connection).toMatchObject({ socialProfileId: 17, state: "error" });
    expect(profile.state).toBe("error");
  });
});
