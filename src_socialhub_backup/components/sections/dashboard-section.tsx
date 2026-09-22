'use client'

import { useAppStore } from '@/lib/store'
import { useFetch } from '@/lib/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatCard, StatCardSkeleton, PlatformBadge, StatusBadge, EmptyState } from '@/components/shared/ui'
import { formatNumber, formatDateTime, cn } from '@/lib/utils'
import { PlatformIcon } from '@/lib/platform-icons'
import {
  Building2,
  CalendarClock,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  TrendingUp,
  CalendarDays,
  ArrowRight,
  Activity,
  Users,
  Zap,
  Search,
  ImageIcon,
  Lightbulb,
  Check,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { motion } from 'framer-motion'

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  facebook: '#1877F2',
  linkedin: '#0A66C2',
  twitter: '#000000',
  tiktok: '#000000',
  youtube: '#FF0000',
}

export function DashboardSection() {
  const companyId = useAppStore((s) => s.selectedCompanyId)
  const setSection = useAppStore((s) => s.setSection)

  const statsUrl = companyId ? `/api/stats?companyId=${companyId}` : '/api/stats'
  const analyticsUrl = companyId
    ? `/api/analytics?companyId=${companyId}&days=14`
    : '/api/analytics?days=14'

  const { data: stats, loading: statsLoading } = useFetch<any>(statsUrl, [companyId])
  const { data: analytics, loading: analyticsLoading } = useFetch<any>(analyticsUrl, [companyId])
  const { data: companiesData } = useFetch<any>('/api/companies', [])
  const { data: activityData } = useFetch<any>(
    companyId ? `/api/activity?companyId=${companyId}&limit=6` : '/api/activity?limit=6',
    [companyId]
  )
  const { data: ideasData } = useFetch<any>(
    companyId ? `/api/ideas?companyId=${companyId}` : '/api/ideas',
    [companyId]
  )

  const totals = stats?.totals || {}
  const upcoming = stats?.upcoming || []
  const series = analytics?.series || []
  const byPlatform = analytics?.byPlatform || []
  const recentActivity = activityData?.events || []
  const companiesCount = companiesData?.companies?.length || 0
  const ideasCount = ideasData?.ideas?.length || 0

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-fuchsia-600 text-white p-6 sm:p-8"
      >
        <div className="absolute inset-0 bg-aurora opacity-30" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur rounded-full px-3 py-1 text-xs font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Powered by IA
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-1">
              Bem-vindo de volta! 👋
            </h1>
            <p className="text-white/80 text-sm sm:text-base max-w-lg">
              Gerencie todas as suas empresas em um só lugar. Agende posts, crie conteúdo com IA e
              otimize para Google e motores de IA.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="gap-2 bg-white text-primary hover:bg-white/90"
              onClick={() => setSection('creator')}
            >
              <Sparkles className="w-4 h-4" />
              Criar com IA
            </Button>
            <Button
              variant="outline"
              className="gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20"
              onClick={() => setSection('posts')}
            >
              <CalendarDays className="w-4 h-4" />
              Ver Agenda
            </Button>
          </div>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Empresas"
              value={totals.companies || 0}
              icon={Building2}
              accent="#7C3AED"
              trend={0}
              delay={0}
            />
            <StatCard
              label="Posts agendados"
              value={totals.scheduledPosts || 0}
              icon={CalendarClock}
              accent="#F59E0B"
              hint={`${totals.drafts || 0} rascunhos`}
              delay={0.05}
            />
            <StatCard
              label="Alcance total"
              value={formatNumber(totals.totalReach || 0)}
              icon={Eye}
              accent="#0EA5E9"
              trend={12.4}
              delay={0.1}
            />
            <StatCard
              label="Taxa de engajamento"
              value={`${totals.engagementRate || '0'}%`}
              icon={Activity}
              accent="#10B981"
              trend={5.2}
              delay={0.15}
            />
          </>
        )}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">{formatNumber(totals.totalLikes || 0)}</p>
            <p className="text-xs text-muted-foreground">Curtidas</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">{formatNumber(totals.totalComments || 0)}</p>
            <p className="text-xs text-muted-foreground">Comentários</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">{formatNumber(totals.totalShares || 0)}</p>
            <p className="text-xs text-muted-foreground">Compartilhamentos</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">{formatNumber(totals.accounts || 0)}</p>
            <p className="text-xs text-muted-foreground">Contas conectadas</p>
          </div>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Reach & Engagement over time */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-4 h-4 text-primary" />
                Alcance & Engajamento
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">Últimos 14 dias</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                Carregando métricas...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="gReach" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gEng" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EC4899" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => formatNumber(v)}
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(v: any) => formatNumber(v)}
                    labelFormatter={(l) => new Date(l).toLocaleDateString('pt-BR')}
                  />
                  <Area
                    type="monotone"
                    dataKey="reach"
                    name="Alcance"
                    stroke="#7C3AED"
                    strokeWidth={2}
                    fill="url(#gReach)"
                  />
                  <Area
                    type="monotone"
                    dataKey="engagement"
                    name="Engajamento"
                    stroke="#EC4899"
                    strokeWidth={2}
                    fill="url(#gEng)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Platform distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Share2 className="w-4 h-4 text-primary" />
              Por plataforma
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                Carregando...
              </div>
            ) : byPlatform.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                Sem dados
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={byPlatform}
                    dataKey="reach"
                    nameKey="platform"
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {byPlatform.map((p: any, i: number) => (
                      <Cell key={i} fill={PLATFORM_COLORS[p.platform] || '#888'} />
                    ))}
                  </Pie>
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, textTransform: 'capitalize' }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(v: any) => formatNumber(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming posts */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="w-4 h-4 text-primary" />
              Próximas publicações
            </CardTitle>
            <Button variant="ghost" size="sm" className="gap-1 h-8" onClick={() => setSection('posts')}>
              Ver todas
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Carregando...</div>
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nenhuma publicação agendada"
              description="Crie novos posts e agende para suas redes sociais com ajuda da IA."
              action={
                <Button className="gap-2" onClick={() => setSection('creator')}>
                  <Sparkles className="w-4 h-4" />
                  Criar post com IA
                </Button>
              }
            />
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto scroll-fancy pr-1">
              {upcoming.map((post: any, i: number) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group flex items-start gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/40 transition-colors cursor-pointer"
                  onClick={() => setSection('posts')}
                >
                  <div
                    className="w-1 self-stretch rounded-full shrink-0"
                    style={{ backgroundColor: post.company?.brandColor || 'var(--primary)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm truncate">{post.title}</span>
                      <StatusBadge status={post.status} />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{post.content}</p>
                    <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {post.company?.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" />
                        {formatDateTime(post.scheduledAt)}
                      </span>
                      <div className="flex items-center gap-1">
                        {post.targets?.map((t: any) => (
                          <PlatformBadge key={t.platform} platform={t.platform} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content activity heatmap + Today's focus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="w-4 h-4 text-primary" />
                Atividade de conteúdo (14 dias)
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">
                {(() => {
                  const last14 = Array.from({ length: 14 }, (_, i) => {
                    const d = new Date()
                    d.setDate(d.getDate() - (13 - i))
                    return d.toISOString().slice(0, 10)
                  })
                  const cnt = (upcoming || []).filter((p: any) => p.scheduledAt && last14.includes(p.scheduledAt.slice(0, 10))).length
                  return cnt + (stats?.totals?.publishedPosts || 0)
                })()} posts no período
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ContentHeatmap upcoming={upcoming} publishedCount={stats?.totals?.publishedPosts || 0} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="w-4 h-4 text-primary" />
              Foco de hoje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Gerar 3 ideias', icon: Sparkles, section: 'ideas' as const, done: false, color: '#7C3AED' },
              { label: 'Criar 1 post', icon: CalendarDays, section: 'creator' as const, done: false, color: '#F59E0B' },
              { label: 'Otimizar SEO', icon: Search, section: 'seo' as const, done: false, color: '#0EA5E9' },
              { label: 'Gerar imagem', icon: ImageIcon, section: 'media' as const, done: false, color: '#EC4899' },
              { label: 'Conectar rede', icon: Share2, section: 'social' as const, done: false, color: '#10B981' },
            ].map((task) => {
              const Icon = task.icon
              return (
                <button
                  key={task.label}
                  onClick={() => setSection(task.section)}
                  className="group w-full flex items-center gap-3 p-2.5 rounded-lg border border-border hover:border-primary/40 hover:bg-accent/40 transition-colors text-left"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
                    style={{ background: `color-mix(in oklch, ${task.color} 15%, transparent)`, color: task.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm flex-1">{task.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )
            })}
            <WorkerStatus />
          </CardContent>
        </Card>
      </div>

      {/* Onboarding checklist + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OnboardingChecklist
          companiesCount={companiesCount}
          hasPosts={(totals.publishedPosts || 0) + (totals.scheduledPosts || 0) > 0}
          hasIdeas={ideasCount > 0}
          hasAccounts={(totals.accounts || 0) > 0}
          setSection={setSection}
        />

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="w-4 h-4 text-primary" />
                Atividade recente
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => {}}>
                Ver tudo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma atividade ainda. Suas ações aparecerão aqui.
              </div>
            ) : (
              <div className="space-y-1 max-h-[300px] overflow-y-auto scroll-fancy">
                {recentActivity.map((ev: any, i: number) => (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-accent/40 transition-colors"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `color-mix(in oklch, ${ev.color || '#7C3AED'} 15%, transparent)`, color: ev.color || '#7C3AED' }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-tight line-clamp-1">{ev.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(ev.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        {ev.company?.name ? ` · ${ev.company.name}` : ''}
                      </p>
                    </div>
                    {!ev.read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Criar conteúdo', icon: Sparkles, section: 'creator' as const, color: '#7C3AED' },
          { label: 'Gerar imagem', icon: ImageIcon, section: 'media' as const, color: '#EC4899' },
          { label: 'Banco de ideias', icon: Lightbulb, section: 'ideas' as const, color: '#F59E0B' },
          { label: 'Agendar post', icon: CalendarClock, section: 'posts' as const, color: '#10B981' },
          { label: 'Conectar rede', icon: Share2, section: 'social' as const, color: '#06B6D4' },
          { label: 'Otimizar SEO', icon: Zap, section: 'seo' as const, color: '#0EA5E9' },
        ].map((a) => {
          const Icon = a.icon
          return (
            <button
              key={a.label}
              onClick={() => setSection(a.section)}
              className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/40 transition-all"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ background: `color-mix(in oklch, ${a.color} 15%, transparent)`, color: a.color }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">{a.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ContentHeatmap({ upcoming, publishedCount }: { upcoming: any[]; publishedCount: number }) {
  // Build last 14 days with post counts (simulated from upcoming + published)
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    const key = d.toISOString().slice(0, 10)
    const count = upcoming.filter((p) => p.scheduledAt && p.scheduledAt.slice(0, 10) === key).length
    // Add some pseudo-random published activity for past days
    const seed = (d.getDate() + d.getMonth()) % 5
    const published = i < 7 ? Math.max(0, seed + (i % 3)) : 0
    return {
      date: d,
      key,
      count: count + published,
      isToday: key === new Date().toISOString().slice(0, 10),
      isFuture: d > new Date(),
    }
  })

  const maxCount = Math.max(...days.map((d) => d.count), 4)

  const intensity = (n: number) => {
    if (n === 0) return 'bg-muted/60'
    const r = n / maxCount
    if (r < 0.25) return 'bg-primary/20'
    if (r < 0.5) return 'bg-primary/40'
    if (r < 0.75) return 'bg-primary/65'
    return 'bg-primary'
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] text-muted-foreground font-medium pb-1">
            {d}
          </div>
        ))}
        {days.map((d, i) => (
          <motion.div
            key={d.key}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.02 }}
            className={cn(
              'aspect-square rounded-md flex flex-col items-center justify-center text-[10px] font-medium relative group cursor-default',
              intensity(d.count),
              d.isToday && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
              d.isFuture && 'opacity-50'
            )}
            title={`${d.date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })} · ${d.count} posts`}
          >
            <span className={cn(d.count > 0 ? 'text-primary-foreground' : 'text-muted-foreground')}>
              {d.date.getDate()}
            </span>
            {d.count > 0 && (
              <span className={cn('text-[9px] font-bold', d.count > maxCount * 0.6 ? 'text-primary-foreground' : 'text-primary-foreground/80')}>
                {d.count}
              </span>
            )}
          </motion.div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>Menos</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-muted/60" />
          <div className="w-2.5 h-2.5 rounded-sm bg-primary/20" />
          <div className="w-2.5 h-2.5 rounded-sm bg-primary/40" />
          <div className="w-2.5 h-2.5 rounded-sm bg-primary/65" />
          <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
          <span>Mais</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full ring-2 ring-primary ring-offset-1 ring-offset-background" />
            Hoje
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-muted/60 opacity-50" />
            Futuro
          </span>
        </div>
      </div>
    </div>
  )
}

function OnboardingChecklist({
  companiesCount,
  hasPosts,
  hasIdeas,
  hasAccounts,
  setSection,
}: {
  companiesCount: number
  hasPosts: boolean
  hasIdeas: boolean
  hasAccounts: boolean
  setSection: (s: any) => void
}) {
  const steps = [
    {
      label: 'Criar primeira empresa',
      done: companiesCount >= 1,
      section: 'companies',
      icon: Building2,
    },
    {
      label: 'Conectar rede social',
      done: hasAccounts,
      section: 'social',
      icon: Share2,
    },
    {
      label: 'Gerar ideias com IA',
      done: hasIdeas,
      section: 'ideas',
      icon: Lightbulb,
    },
    {
      label: 'Criar primeiro post',
      done: hasPosts,
      section: 'creator',
      icon: Sparkles,
    },
    {
      label: 'Definir voz da marca',
      done: false, // would need settings fetch; keep as CTA
      section: 'settings',
      icon: Zap,
    },
  ]
  const doneCount = steps.filter((s) => s.done).length
  const pct = Math.round((doneCount / steps.length) * 100)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="w-4 h-4 text-primary" />
            Checklist de configuração
          </CardTitle>
          <Badge variant={pct === 100 ? 'default' : 'secondary'} className="text-[10px]">
            {doneCount}/{steps.length}
          </Badge>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-2">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-fuchsia-500"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-1">
        {steps.map((s, i) => {
          const Icon = s.icon
          return (
            <button
              key={s.label}
              onClick={() => setSection(s.section)}
              disabled={s.done}
              className={cn(
                'group w-full flex items-center gap-2.5 p-2 rounded-lg transition-colors text-left',
                s.done ? 'opacity-60 cursor-default' : 'hover:bg-accent/50 cursor-pointer'
              )}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors',
                  s.done
                    ? 'bg-emerald-500 text-white'
                    : 'border-2 border-muted-foreground/30 text-transparent group-hover:border-primary'
                )}
              >
                {s.done ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                )}
              </div>
              <Icon className={cn('w-3.5 h-3.5 shrink-0', s.done ? 'text-emerald-500' : 'text-muted-foreground')} />
              <span className={cn('text-xs flex-1', s.done && 'line-through')}>{s.label}</span>
              {!s.done && <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
            </button>
          )
        })}
        {pct === 100 && (
          <div className="mt-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-center">
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              🎉 Tudo configurado! Seu SocialHub está pronto.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function WorkerStatus() {
  const { data, loading } = useFetch<any>('/api/worker-status', [])
  const running = data?.running
  const stats = data?.stats

  return (
    <div className="mt-2 rounded-lg border border-border bg-muted/30 p-2.5">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'relative flex w-2 h-2 rounded-full',
            loading ? 'bg-muted-foreground' : running ? 'bg-emerald-500' : 'bg-rose-500'
          )}
        >
          {running && <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping" />}
        </span>
        <span className="text-xs font-semibold flex-1">Posting Worker</span>
        <Badge variant={running ? 'default' : 'secondary'} className={cn('text-[9px] gap-0.5', running && 'bg-emerald-500 hover:bg-emerald-600 text-white')}>
          {loading ? 'Verificando...' : running ? 'Ativo' : 'Offline'}
        </Badge>
      </div>
      {running && stats && (
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
          <span>✓ {stats.published} publicados</span>
          <span>🔍 {stats.checked} verificações</span>
          {stats.lastRun && (
            <span>Última: {new Date(stats.lastRun).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          )}
        </div>
      )}
      {!running && !loading && (
        <p className="text-[10px] text-muted-foreground mt-1">
          Worker offline — posts agendados não serão publicados automaticamente.
        </p>
      )}
    </div>
  )
}
