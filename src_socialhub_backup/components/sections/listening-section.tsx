'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { useFetch, apiPost, apiDelete, apiPatch } from '@/lib/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SectionHeader, EmptyState, PlatformBadge } from '@/components/shared/ui'
import { cn, formatNumber } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Radar,
  Sparkles,
  Loader2,
  RefreshCw,
  Trash2,
  Reply,
  CheckCircle2,
  Smile,
  Frown,
  Meh,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  BadgeCheck,
  Clock,
  Hash,
} from 'lucide-react'

const SENTIMENT_META: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  positive: { label: 'Positivo', color: '#10B981', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', icon: Smile },
  neutral: { label: 'Neutro', color: '#6B7280', bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: Meh },
  negative: { label: 'Negativo', color: '#EF4444', bg: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300', icon: Frown },
}

function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}min atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d atrás`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function ListeningSection() {
  const companyId = useAppStore((s) => s.selectedCompanyId)
  const [scanning, setScanning] = useState(false)
  const [filterSentiment, setFilterSentiment] = useState('all')
  const [filterPlatform, setFilterPlatform] = useState('all')

  const { data: compData } = useFetch<{ companies: any[] }>('/api/companies', [])
  const companies = compData?.companies || []
  const activeCompany = companies.find((c: any) => c.id === companyId)

  const baseUrl = companyId ? `/api/mentions?companyId=${companyId}` : null
  const url = baseUrl
    ? `${baseUrl}&sentiment=${filterSentiment}&platform=${filterPlatform}&limit=50`
    : null
  const { data, loading, refresh } = useFetch<any>(url, [companyId, filterSentiment, filterPlatform])

  const mentions = data?.mentions || []
  const summary = data?.summary

  async function handleScan() {
    if (!companyId) {
      toast.error('Selecione uma empresa no topo')
      return
    }
    if (!activeCompany?.niche) {
      toast.error('A empresa precisa ter um nicho definido')
      return
    }
    setScanning(true)
    try {
      const res = await apiPost<any>('/api/mentions/scan', {
        company: activeCompany.name,
        niche: activeCompany.niche,
        platforms: ['instagram', 'twitter', 'facebook', 'tiktok'],
        companyId,
        save: true,
      })
      toast.success(`${res.count} menções encontradas!`)
      refresh()
    } catch (e: any) {
      toast.error(e.message || 'Falha no scan')
    } finally {
      setScanning(false)
    }
  }

  async function handleReply(id: string) {
    try {
      await apiPatch(`/api/mentions/${id}`, { replied: true })
      toast.success('Marcado como respondido')
      refresh()
    } catch {
      toast.error('Erro ao atualizar')
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiDelete(`/api/mentions?id=${id}`)
      toast.success('Menção removida')
      refresh()
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  if (!companyId) {
    return (
      <div className="space-y-6">
        <SectionHeader
          icon={Radar}
          title="Menções & Social Listening"
          description="Monitoramento de marca com análise de sentimento"
        />
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Radar}
              title="Selecione uma empresa"
              description="Escolha uma empresa no topo da tela para monitorar menções da marca em redes sociais."
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Radar}
        title="Menções & Social Listening"
        description={`Monitoramento de marca para ${activeCompany?.name || ''}`}
        action={
          <Button
            className="gap-2 bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90"
            onClick={handleScan}
            disabled={scanning}
          >
            {scanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Escaneando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Escanear menções
              </>
            )}
          </Button>
        }
      />

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Radar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums">{summary.total}</p>
              <p className="text-xs text-muted-foreground">Menções</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums">{summary.positivePct}%</p>
              <p className="text-xs text-muted-foreground">Positivas</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-500/10 text-gray-500 flex items-center justify-center">
              <Meh className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums">{summary.neutralPct}%</p>
              <p className="text-xs text-muted-foreground">Neutras</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Frown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums">{summary.negativePct}%</p>
              <p className="text-xs text-muted-foreground">Negativas</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums">{formatNumber(summary.totalReach)}</p>
              <p className="text-xs text-muted-foreground">Alcance total</p>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Mention feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <Card className="p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={filterSentiment} onValueChange={setFilterSentiment}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Sentimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos sentimentos</SelectItem>
                  <SelectItem value="positive">Positivo</SelectItem>
                  <SelectItem value="neutral">Neutro</SelectItem>
                  <SelectItem value="negative">Negativo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Plataforma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas plataformas</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="twitter">Twitter / X</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" className="h-9 gap-1.5 ml-auto" onClick={refresh}>
                <RefreshCw className="w-3.5 h-3.5" />
                Atualizar
              </Button>
            </div>
          </Card>

          {/* Mentions list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="w-4 h-4 text-primary" />
                Feed de menções
                <Badge variant="secondary" className="text-[10px]">{mentions.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                  ))}
                </div>
              ) : mentions.length === 0 ? (
                <EmptyState
                  icon={Radar}
                  title="Nenhuma menção encontrada"
                  description="Escaneie as redes sociais com IA para encontrar menções da sua marca, ou ajuste os filtros."
                  action={
                    <Button
                      className="gap-2 bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90"
                      onClick={handleScan}
                      disabled={scanning}
                    >
                      <Sparkles className="w-4 h-4" />
                      Escanear agora
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto scroll-fancy pr-1">
                  <AnimatePresence mode="popLayout">
                    {mentions.map((m: any, i: number) => {
                      const sm = SENTIMENT_META[m.sentiment] || SENTIMENT_META.neutral
                      const SentimentIcon = sm.icon
                      let tags: string[] = []
                      try {
                        tags = JSON.parse(m.tags || '[]')
                      } catch {
                        tags = []
                      }
                      return (
                        <motion.div
                          key={m.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: Math.min(i * 0.03, 0.3) }}
                          className={cn(
                            'group relative rounded-xl border p-3 transition-colors',
                            m.replied
                              ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20'
                              : 'border-border hover:border-primary/40'
                          )}
                        >
                          {/* Sentiment stripe */}
                          <div
                            className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
                            style={{ backgroundColor: sm.color }}
                          />

                          <div className="pl-2">
                            {/* Header */}
                            <div className="flex items-start gap-2 mb-2">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                                style={{ backgroundColor: sm.color }}
                              >
                                {m.author.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-sm truncate">{m.author}</span>
                                  {m.authorHandle && (
                                    <span className="text-xs text-muted-foreground truncate">{m.authorHandle}</span>
                                  )}
                                  {m.isVerified && (
                                    <BadgeCheck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                                  )}
                                  <Badge className={cn('text-[9px] gap-0.5 ml-auto', sm.bg)}>
                                    <SentimentIcon className="w-2.5 h-2.5" />
                                    {sm.label}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <PlatformBadge platform={m.platform} />
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    {timeAgo(m.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Content */}
                            <p className="text-sm text-foreground mb-2 leading-relaxed">{m.content}</p>

                            {/* Tags */}
                            {tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {tags.map((t, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                                  >
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Metrics + actions */}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1" title="Alcance">
                                <Eye className="w-3 h-3" />
                                {formatNumber(m.reach)}
                              </span>
                              <span className="flex items-center gap-1" title="Engajamento">
                                <Heart className="w-3 h-3" />
                                {formatNumber(m.engagement)}
                              </span>
                              <span className="flex items-center gap-1" title="Score de sentimento">
                                <TrendingUp className="w-3 h-3" />
                                {m.sentimentScore > 0 ? '+' : ''}{m.sentimentScore.toFixed(2)}
                              </span>

                              <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                {!m.replied ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs gap-1 text-emerald-600 hover:text-emerald-700"
                                    onClick={() => handleReply(m.id)}
                                  >
                                    <Reply className="w-3 h-3" />
                                    Responder
                                  </Button>
                                ) : (
                                  <span className="flex items-center gap-1 text-xs text-emerald-600">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Respondido
                                  </span>
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="w-7 h-7 hover:text-rose-500"
                                  onClick={() => handleDelete(m.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: sentiment breakdown + trending topics */}
        <div className="space-y-4">
          {/* Sentiment breakdown */}
          {summary && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Distribuição de sentimento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <SentimentBar
                  label="Positivo"
                  pct={summary.positivePct}
                  count={summary.positive}
                  color="#10B981"
                />
                <SentimentBar
                  label="Neutro"
                  pct={summary.neutralPct}
                  count={summary.neutral}
                  color="#6B7280"
                />
                <SentimentBar
                  label="Negativo"
                  pct={summary.negativePct}
                  count={summary.negative}
                  color="#EF4444"
                />
                <Separator />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Score médio</span>
                  <span
                    className={cn(
                      'font-bold',
                      Number(summary.avgSentiment) > 0.2
                        ? 'text-emerald-600'
                        : Number(summary.avgSentiment) < -0.2
                          ? 'text-rose-600'
                          : 'text-muted-foreground'
                    )}
                  >
                    {Number(summary.avgSentiment) > 0 ? '+' : ''}{summary.avgSentiment}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trending topics */}
          {summary?.trendingTopics?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Hash className="w-4 h-4 text-primary" />
                  Tópicos em alta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {summary.trendingTopics.map((t: any, i: number) => {
                    const maxCount = summary.trendingTopics[0].count
                    const pct = (t.count / maxCount) * 100
                    return (
                      <div key={t.topic} className="group">
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="font-medium">#{t.topic}</span>
                          <span className="text-muted-foreground">{t.count}x</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-primary to-fuchsia-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function SentimentBar({
  label,
  pct,
  count,
  color,
}: {
  label: string
  pct: number
  count: number
  color: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{count} ({pct}%)</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  )
}
