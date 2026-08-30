'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'
import {
  BarChart3,
  Download,
  Eye,
  Heart,
  MousePointerClick,
  Users,
  TrendingUp,
  PieChart as PieChartIcon,
  Activity,
  LineChart as LineChartIcon,
  BarChart2,
  Sparkles,
} from 'lucide-react'

import { useAppStore } from '@/lib/store'
import { useFetch } from '@/lib/hooks'
import { cn, formatNumber } from '@/lib/utils'
import { PlatformIcon } from '@/lib/platform-icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  StatCard,
  StatCardSkeleton,
  SectionHeader,
  EmptyState,
  PlatformBadge,
} from '@/components/shared/ui'

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  facebook: '#1877F2',
  linkedin: '#0A66C2',
  twitter: '#000000',
  tiktok: '#000000',
  youtube: '#FF0000',
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  twitter: 'Twitter / X',
  tiktok: 'TikTok',
  youtube: 'YouTube',
}

const PERIODS = [
  { value: 7, label: '7 dias' },
  { value: 14, label: '14 dias' },
  { value: 30, label: '30 dias' },
] as const

// ---------- Helpers ----------
function shortDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function longDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function engRate(eng: number, reach: number) {
  if (!reach) return 0
  return (eng / reach) * 100
}

// ---------- Custom Tooltip ----------
function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur px-3 py-2 shadow-lg">
      {label && (
        <p className="text-[11px] font-medium text-muted-foreground mb-1.5">
          {longDate(label)}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: p.color || p.fill }}
            />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-semibold tabular-nums">
              {formatter ? formatter(p.value) : formatNumber(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- Chart Skeleton ----------
function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="relative overflow-hidden rounded-lg" style={{ height }}>
      <div className="absolute inset-0 shimmer opacity-50" />
      <div className="relative h-full flex items-end gap-2 px-4 pb-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${30 + Math.sin(i) * 25 + 30}%` }}
          />
        ))}
      </div>
    </div>
  )
}

// ---------- Main Component ----------
export function AnalyticsSection() {
  const companyId = useAppStore((s) => s.selectedCompanyId)
  const [days, setDays] = useState<number>(14)

  const analyticsUrl = companyId
    ? `/api/analytics?companyId=${companyId}&days=${days}`
    : `/api/analytics?days=${days}`

  const { data, loading, error } = useFetch<any>(analyticsUrl, [companyId, days])

  const series = data?.series || []
  const byPlatform = data?.byPlatform || []
  const total = data?.total || {
    followers: 0,
    reach: 0,
    engagement: 0,
    clicks: 0,
    impressions: 0,
  }

  // Derived KPI deltas (compare first vs last in series)
  const first = series[0]
  const last = series[series.length - 1]
  const followerDelta =
    first && last && first.followers > 0
      ? ((last.followers - first.followers) / first.followers) * 100
      : 0
  const reachDelta =
    first && last && first.reach > 0 ? ((last.reach - first.reach) / first.reach) * 100 : 0
  const engagementDelta =
    first && last && first.engagement > 0
      ? ((last.engagement - first.engagement) / first.engagement) * 100
      : 0
  const clicksDelta =
    first && last && first.clicks > 0 ? ((last.clicks - first.clicks) / first.clicks) * 100 : 0

  const handleExport = () => {
    toast.success('Relatório gerado', {
      description: `Período: ${days} dias • ${series.length} pontos de dados`,
    })
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={BarChart3}
        title="Analytics"
        description="Acompanhe o desempenho das suas redes sociais em tempo real."
        action={
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-border bg-card p-0.5 shadow-sm">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setDays(p.value)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                    days === p.value
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Baixar relatório</span>
            </Button>
          </div>
        }
      />

      {/* KPI Row */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Erro ao carregar métricas: {error}
        </Card>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Total de seguidores"
            value={formatNumber(total.followers || 0)}
            icon={Users}
            accent="#7C3AED"
            trend={Number(followerDelta.toFixed(1))}
            delay={0}
          />
          <StatCard
            label="Alcance total"
            value={formatNumber(total.reach || 0)}
            icon={Eye}
            accent="#0EA5E9"
            trend={Number(reachDelta.toFixed(1))}
            delay={0.05}
          />
          <StatCard
            label="Engajamento total"
            value={formatNumber(total.engagement || 0)}
            icon={Heart}
            accent="#EC4899"
            trend={Number(engagementDelta.toFixed(1))}
            delay={0.1}
          />
          <StatCard
            label="Cliques totais"
            value={formatNumber(total.clicks || 0)}
            icon={MousePointerClick}
            accent="#10B981"
            trend={Number(clicksDelta.toFixed(1))}
            delay={0.15}
          />
        </div>
      )}

      {/* Charts Row 1 — Followers growth + Reach vs Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Followers growth */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                  Crescimento de seguidores
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Users className="w-3 h-3" />
                  {formatNumber(total.followers || 0)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : series.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title="Sem dados de crescimento"
                  description="Não há dados suficientes para o período selecionado."
                />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gFollowers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={shortDate}
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={20}
                    />
                    <YAxis
                      tickFormatter={(v) => formatNumber(v)}
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                      width={44}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="followers"
                      name="Seguidores"
                      stroke="#7C3AED"
                      strokeWidth={2.5}
                      fill="url(#gFollowers)"
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--card)' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* By platform pie */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="w-7 h-7 rounded-lg bg-fuchsia-500/10 text-fuchsia-500 flex items-center justify-center">
                  <PieChartIcon className="w-4 h-4" />
                </span>
                Alcance por plataforma
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton height={280} />
              ) : byPlatform.length === 0 ? (
                <EmptyState
                  icon={PieChartIcon}
                  title="Sem dados por plataforma"
                  description="Conecte redes sociais para visualizar a distribuição."
                />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={byPlatform}
                      dataKey="reach"
                      nameKey="platform"
                      cx="50%"
                      cy="45%"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={2}
                      stroke="var(--card)"
                      strokeWidth={2}
                    >
                      {byPlatform.map((p: any, i: number) => (
                        <Cell key={i} fill={PLATFORM_COLORS[p.platform] || '#888'} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (!active || !payload?.length) return null
                        const p = payload[0].payload
                        return (
                          <div className="rounded-xl border border-border bg-card/95 backdrop-blur px-3 py-2 shadow-lg">
                            <div className="flex items-center gap-2 mb-0.5">
                              <PlatformBadge platform={p.platform} />
                              <span className="font-semibold text-sm">
                                {PLATFORM_LABELS[p.platform] || p.platform}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Alcance: <span className="font-semibold">{formatNumber(p.reach)}</span>
                            </p>
                          </div>
                        )
                      }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11, textTransform: 'capitalize' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 2 — Reach vs Engagement (grouped bar) + Impressions (line) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Reach vs Engagement grouped bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
                    <BarChart2 className="w-4 h-4" />
                  </span>
                  Alcance vs Engajamento
                </CardTitle>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0EA5E9]" />
                    Alcance
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]" />
                    Engajamento
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : series.length === 0 ? (
                <EmptyState
                  icon={BarChart2}
                  title="Sem dados de comparação"
                  description="Não há dados para o período selecionado."
                />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={shortDate}
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={20}
                    />
                    <YAxis
                      tickFormatter={(v) => formatNumber(v)}
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                      width={44}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--accent)', fillOpacity: 0.3 }}
                      content={<ChartTooltip />}
                    />
                    <Bar
                      dataKey="reach"
                      name="Alcance"
                      fill="#0EA5E9"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={24}
                    />
                    <Bar
                      dataKey="engagement"
                      name="Engajamento"
                      fill="#EC4899"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Impressions line */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <LineChartIcon className="w-4 h-4" />
                  </span>
                  Impressões ao longo do tempo
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Activity className="w-3 h-3" />
                  {formatNumber(total.impressions || 0)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : series.length === 0 ? (
                <EmptyState
                  icon={LineChartIcon}
                  title="Sem dados de impressões"
                  description="Não há impressões registradas no período."
                />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={shortDate}
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={20}
                    />
                    <YAxis
                      tickFormatter={(v) => formatNumber(v)}
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                      width={44}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="impressions"
                      name="Impressões"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--card)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 3 — Engagement rate by platform (horizontal bar) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <Heart className="w-4 h-4" />
                </span>
                Taxa de engajamento por plataforma
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">
                Engajamento / Alcance %
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartSkeleton height={260} />
            ) : byPlatform.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="Sem dados de engajamento"
                description="Conecte redes sociais para visualizar a taxa de engajamento."
              />
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(220, byPlatform.length * 56)}>
                <BarChart
                  layout="vertical"
                  data={byPlatform.map((p: any) => ({
                    ...p,
                    name: PLATFORM_LABELS[p.platform] || p.platform,
                    engRate: Number(engRate(p.engagement, p.reach).toFixed(2)),
                  }))}
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: 'var(--foreground)' }}
                    axisLine={false}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--accent)', fillOpacity: 0.3 }}
                    content={({ active, payload }: any) => {
                      if (!active || !payload?.length) return null
                      const p = payload[0].payload
                      return (
                        <div className="rounded-xl border border-border bg-card/95 backdrop-blur px-3 py-2 shadow-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <PlatformBadge platform={p.platform} />
                            <span className="font-semibold text-sm">{p.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Taxa: <span className="font-semibold text-rose-500">{p.engRate}%</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Engajamento: <span className="font-semibold">{formatNumber(p.engagement)}</span>
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="engRate" name="Taxa de engajamento" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {byPlatform.map((p: any, i: number) => (
                      <Cell key={i} fill={PLATFORM_COLORS[p.platform] || '#888'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Platform breakdown table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </span>
                Detalhamento por plataforma
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">
                {byPlatform.length} {byPlatform.length === 1 ? 'plataforma' : 'plataformas'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : byPlatform.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="Nenhuma plataforma conectada"
                description="Conecte suas redes sociais para visualizar métricas detalhadas."
              />
            ) : (
              <div className="max-h-96 overflow-y-auto scroll-fancy rounded-lg border border-border">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-10">Plataforma</TableHead>
                      <TableHead className="text-right">Seguidores</TableHead>
                      <TableHead className="text-right">Alcance</TableHead>
                      <TableHead className="text-right">Engajamento</TableHead>
                      <TableHead className="text-right">Cliques</TableHead>
                      <TableHead className="text-right">Taxa eng.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byPlatform.map((p: any, i: number) => {
                      const rate = engRate(p.engagement, p.reach)
                      const rateColor =
                        rate >= 5
                          ? 'text-emerald-600'
                          : rate >= 2
                            ? 'text-amber-600'
                            : 'text-rose-600'
                      return (
                        <motion.tr
                          key={p.platform}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="hover:bg-accent/40 transition-colors"
                        >
                          <TableCell className="py-2.5">
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                                style={{
                                  backgroundColor: PLATFORM_COLORS[p.platform] || '#888',
                                }}
                              >
                                <PlatformIcon
                                  platform={p.platform}
                                  className="w-4 h-4"
                                />
                              </span>
                              <span className="font-medium text-sm">
                                {PLATFORM_LABELS[p.platform] || p.platform}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {formatNumber(p.followers)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {formatNumber(p.reach)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {formatNumber(p.engagement)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {formatNumber(p.clicks)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 text-xs font-semibold tabular-nums px-2 py-0.5 rounded-md bg-muted',
                                rateColor
                              )}
                            >
                              {rate.toFixed(2)}%
                            </span>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
