'use client'

import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { motion } from 'framer-motion'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  hint?: string
  trend?: number
  accent?: string
  delay?: number
}

export function StatCard({ label, value, icon: Icon, hint, trend, accent, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card className="relative overflow-hidden p-5 group hover:shadow-lg transition-shadow">
        <div
          className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
          style={{ background: accent || 'var(--primary)' }}
        />
        <div className="flex items-start justify-between mb-3 relative">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
            style={{
              background: `color-mix(in oklch, ${accent || 'var(--primary)'} 15%, transparent)`,
              color: accent || 'var(--primary)',
            }}
          >
            <Icon className="w-5 h-5" />
          </div>
          {typeof trend === 'number' && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md',
                trend >= 0
                  ? 'text-emerald-600 bg-emerald-500/10'
                  : 'text-rose-600 bg-rose-500/10'
              )}
            >
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div className="relative">
          <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
          {hint && <p className="text-[11px] text-muted-foreground/70 mt-1">{hint}</p>}
        </div>
      </Card>
    </motion.div>
  )
}

export function StatCardSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="w-11 h-11 rounded-xl" />
        <Skeleton className="h-5 w-12 rounded-md" />
      </div>
      <Skeleton className="h-7 w-20 mb-2" />
      <Skeleton className="h-4 w-32" />
    </Card>
  )
}

export function SectionHeader({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: LucideIcon
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  )
}

export function PlatformBadge({
  platform,
  size = 'sm',
}: {
  platform: string
  size?: 'sm' | 'md'
}) {
  const meta: Record<string, { color: string; label: string }> = {
    instagram: { color: '#E1306C', label: 'IG' },
    facebook: { color: '#1877F2', label: 'FB' },
    linkedin: { color: '#0A66C2', label: 'in' },
    twitter: { color: '#000000', label: 'X' },
    tiktok: { color: '#000000', label: 'TT' },
    youtube: { color: '#FF0000', label: 'YT' },
  }
  const m = meta[platform] || { color: '#888', label: '?' }
  const sz = size === 'md' ? 'w-8 h-8 text-xs' : 'w-6 h-6 text-[10px]'
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-md font-bold text-white shrink-0',
        sz
      )}
      style={{ backgroundColor: m.color }}
      title={platform}
    >
      {m.label}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: 'Rascunho', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    scheduled: { label: 'Agendado', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    publishing: { label: 'Publicando', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    published: { label: 'Publicado', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    failed: { label: 'Falhou', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
  }
  const m = map[status] || map.draft
  return (
    <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full', m.cls)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {m.label}
    </span>
  )
}
