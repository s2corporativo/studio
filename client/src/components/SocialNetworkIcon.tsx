import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok, FaYoutube } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import React from "react";

export type SocialNetworkPlatform = "instagram" | "facebook" | "linkedin" | "tiktok" | "youtube";

const platformConfig = {
  instagram: { label: "Instagram", Icon: FaInstagram, className: "studio-brand-instagram" },
  facebook: { label: "Facebook", Icon: FaFacebookF, className: "studio-brand-facebook" },
  linkedin: { label: "LinkedIn", Icon: FaLinkedinIn, className: "studio-brand-linkedin" },
  tiktok: { label: "TikTok", Icon: FaTiktok, className: "studio-brand-tiktok" },
  youtube: { label: "YouTube", Icon: FaYoutube, className: "studio-brand-youtube" },
} satisfies Record<SocialNetworkPlatform, { label: string; Icon: typeof FaInstagram; className: string }>;

export function SocialNetworkIcon({ platform, className }: { platform: SocialNetworkPlatform; className?: string }) {
  const { Icon, className: platformClass } = platformConfig[platform];
  return <span className={cn("studio-network-icon", platformClass, className)} aria-label={platformConfig[platform].label}><Icon aria-hidden="true" /></span>;
}

export function socialNetworkLabel(platform: SocialNetworkPlatform) {
  return platformConfig[platform].label;
}
