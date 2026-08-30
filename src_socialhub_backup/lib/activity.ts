import { db } from '@/lib/db'

export async function logActivity(opts: {
  companyId?: string | null
  type: string
  title: string
  description?: string
  icon?: string
  color?: string
  meta?: any
}) {
  try {
    await db.activityEvent.create({
      data: {
        companyId: opts.companyId || null,
        type: opts.type,
        title: opts.title,
        description: opts.description || null,
        icon: opts.icon || null,
        color: opts.color || null,
        meta: opts.meta ? JSON.stringify(opts.meta) : null,
      },
    })
  } catch (e) {
    // Best-effort logging — never fail the main operation
    console.error('logActivity failed:', e)
  }
}

export const ACTIVITY_TYPES = {
  POST_CREATED: 'post_created',
  POST_SCHEDULED: 'post_scheduled',
  POST_PUBLISHED: 'post_published',
  MEDIA_GENERATED: 'media_generated',
  IDEA_GENERATED: 'idea_generated',
  COMPANY_ADDED: 'company_added',
  ACCOUNT_CONNECTED: 'account_connected',
  SEO_OPTIMIZED: 'seo_optimized',
  KEYWORDS_RESEARCHED: 'keywords_researched',
} as const

export const ACTIVITY_COLORS: Record<string, string> = {
  post_created: '#7C3AED',
  post_scheduled: '#F59E0B',
  post_published: '#10B981',
  media_generated: '#EC4899',
  idea_generated: '#F59E0B',
  company_added: '#0EA5E9',
  account_connected: '#06B6D4',
  seo_optimized: '#8B5CF6',
  keywords_researched: '#14B8A6',
}
