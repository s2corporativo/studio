import { cn } from "@/lib/utils";
import { Facebook, Instagram, Linkedin, Music2, Youtube, type LucideIcon } from "lucide-react";
import React from "react";

export type SocialNetworkPlatform = "instagram" | "facebook" | "linkedin" | "tiktok" | "youtube";

const platformConfig = {
  instagram: { label: "Instagram", Icon: Instagram, className: "studio-brand-instagram" },
  facebook: { label: "Facebook", Icon: Facebook, className: "studio-brand-facebook" },
  linkedin: { label: "LinkedIn", Icon: Linkedin, className: "studio-brand-linkedin" },
  tiktok: { label: "TikTok", Icon: Music2, className: "studio-brand-tiktok" },
  youtube: { label: "YouTube", Icon: Youtube, className: "studio-brand-youtube" },
} satisfies Record<SocialNetworkPlatform, { label: string; Icon: LucideIcon; className: string }>;

export function SocialNetworkIcon({ platform, className }: { platform: SocialNetworkPlatform; className?: string }) {
  const { Icon, className: platformClass } = platformConfig[platform];
  return <span className={cn("studio-network-icon", platformClass, className)} aria-label={platformConfig[platform].label}><Icon aria-hidden="true" /></span>;
}

export function socialNetworkLabel(platform: SocialNetworkPlatform) {
  return platformConfig[platform].label;
}
