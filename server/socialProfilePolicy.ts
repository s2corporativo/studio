import { z } from "zod";
import { socialNetworks } from "../drizzle/schema";

export const socialNetworkInput = z.enum(socialNetworks);

export const publicSocialProfileUrl = z.string().url().refine(value => new URL(value).protocol === "https:", "Informe uma URL pública HTTPS válida.");

export const publicSocialProfileHandle = z.string().trim().max(160).nullable().transform(value => value?.replace(/^@+/, "") || null);

export function profileConnectionMode(network: (typeof socialNetworks)[number]) {
  return network === "instagram" ? "oauth_available" : "manual_reference";
}
