export type InstagramConnectionState = "disconnected" | "pending" | "connected" | "expired" | "error";
export type InstagramProfileState = "active" | "pending_oauth" | "connected" | "error";

export function profileStateForInstagramConnection(state: InstagramConnectionState): InstagramProfileState {
  if (state === "pending") return "pending_oauth";
  if (state === "connected") return "connected";
  if (state === "error" || state === "expired") return "error";
  return "active";
}

export function instagramOAuthCardState(profileId: number, connection: { socialProfileId?: number | null; state?: string | null } | null | undefined) {
  if (connection?.socialProfileId !== profileId) return { linked: false, label: "OAuth não associado a este perfil" };
  const label = ({
    pending: "OAuth aguardando autorização",
    connected: "OAuth conectado",
    error: "OAuth exige atenção",
    expired: "OAuth exige renovação",
    disconnected: "OAuth não iniciado",
  } as Record<string, string>)[connection.state ?? "disconnected"] ?? "OAuth não iniciado";
  return { linked: true, label };
}
