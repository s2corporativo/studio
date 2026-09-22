export const PLATFORMS = [
  'instagram',
  'facebook',
  'linkedin',
  'twitter',
  'tiktok',
  'youtube',
] as const

export type Platform = (typeof PLATFORMS)[number]

export const PLATFORM_META: Record<
  Platform,
  { label: string; color: string; bgColor: string; icon: string; charLimit: number }
> = {
  instagram: {
    label: 'Instagram',
    color: '#E1306C',
    bgColor: '#FCE7F3',
    icon: 'instagram',
    charLimit: 2200,
  },
  facebook: {
    label: 'Facebook',
    color: '#1877F2',
    bgColor: '#DBEAFE',
    icon: 'facebook',
    charLimit: 5000,
  },
  linkedin: {
    label: 'LinkedIn',
    color: '#0A66C2',
    bgColor: '#DBEAFE',
    icon: 'linkedin',
    charLimit: 3000,
  },
  twitter: {
    label: 'Twitter / X',
    color: '#000000',
    bgColor: '#F3F4F6',
    icon: 'twitter',
    charLimit: 280,
  },
  tiktok: {
    label: 'TikTok',
    color: '#000000',
    bgColor: '#F3F4F6',
    icon: 'tiktok',
    charLimit: 2200,
  },
  youtube: {
    label: 'YouTube',
    color: '#FF0000',
    bgColor: '#FEE2E2',
    icon: 'youtube',
    charLimit: 5000,
  },
}

export const POST_STATUSES = [
  'draft',
  'review',
  'approved',
  'scheduled',
  'publishing',
  'published',
  'failed',
] as const
export type PostStatus = (typeof POST_STATUSES)[number]

export const POST_STATUS_META: Record<PostStatus, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: '#6B7280' },
  review: { label: 'Em revisão', color: '#8B5CF6' },
  approved: { label: 'Aprovado', color: '#06B6D4' },
  scheduled: { label: 'Agendado', color: '#F59E0B' },
  publishing: { label: 'Publicando', color: '#3B82F6' },
  published: { label: 'Publicado', color: '#10B981' },
  failed: { label: 'Falhou', color: '#EF4444' },
}

export const POST_CATEGORIES = [
  { value: 'promocional', label: 'Promocional' },
  { value: 'educacional', label: 'Educacional' },
  { value: 'engajamento', label: 'Engajamento' },
  { value: 'anuncio', label: 'Anúncio' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'product', label: 'Produto' },
] as const

export const TONES = [
  'profissional',
  'casual',
  'divertido',
  'inspirador',
  'autoridade',
  'empático',
  'vendas',
] as const

export interface Company {
  id: string
  name: string
  logo: string | null
  description: string | null
  niche: string | null
  website: string | null
  brandColor: string | null
  city: string | null
  createdAt: string
  _count?: { posts: number; socialAccounts: number }
  socialAccounts?: SocialAccount[]
}

export interface SocialAccount {
  id: string
  companyId: string
  platform: Platform
  handle: string
  displayName: string | null
  avatarUrl: string | null
  profileUrl: string | null
  followers: number
  following: number
  posts: number
  connected: boolean
  verified: boolean
}

export interface Post {
  id: string
  companyId: string
  title: string
  content: string
  mediaUrls: string
  hashtags: string
  scheduledAt: string | null
  status: PostStatus
  category: string | null
  tone: string | null
  createdAt: string
  updatedAt: string
  targets?: PostTarget[]
  company?: Company
}

export interface PostTarget {
  id: string
  postId: string
  platform: Platform
  content: string
  status: string
  publishedAt: string | null
  likes: number
  comments: number
  shares: number
  saves: number
  reach: number
  impressions: number
}
