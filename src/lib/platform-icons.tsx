'use client'

import {
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
  Music2,
  type LucideIcon,
} from 'lucide-react'
import type { Platform } from './types'

export const PLATFORM_ICONS: Record<Platform, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  twitter: Twitter,
  tiktok: Music2,
  youtube: Youtube,
}

export function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  const Icon = PLATFORM_ICONS[platform as Platform] || Instagram
  return <Icon className={className} />
}
