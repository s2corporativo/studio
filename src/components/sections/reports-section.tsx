'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { useFetch, apiPost, apiDelete } from '@/lib/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { SectionHeader, EmptyState } from '@/components/shared/ui'
import { cn, formatNumber, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileBarChart,
  FileText,
  Download,
  Trash2,
  Loader2,
  Calendar,
  TrendingUp,
  Users,
  Heart,
  Eye,
  Sparkles,
  FileSpreadsheet,
  FileType,
  Plus,
  CheckCircle2,
  Clock,
} from 'lucide-react'

const REPORT_TYPES: Record<string, { label: string; color: string; icon: any; description: string }> = {
  weekly: { label: 'Semanal', color: '#7C3AED', icon: Calendar, description: 'Resumo da semana com métricas de todos os posts' },
  monthly: { label: 'Mensal', color: '#0EA5E9', icon: TrendingUp, description: 'Performance mensal completa com gráficos e insights' },
  campaign: { label: 'Campanha', color: '#EC4899', icon: Sparkles, description: 'Relatório de uma campanha específica com ROI' },
  competitor: { label: 'Concorrentes', color: '#F59E0B', icon: Users, description: 'Análise comparativa com concorrentes' },
}

export function ReportsSection() {
  const companyId = useAppStore((s) => s.selectedCompanyId)
  const [genOpen, setGenOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [reportType, setReportType] = useState('weekly')

  const url = companyId ? `/api/reports?companyId=${companyId}` : null
  const { data, loading, refresh } = useFetch<any>(url, [companyId])
  const reports = data?.reports || []

  const { data: statsData } = useFetch<any>(
    companyId ? `/api/stats?companyId=${companyId}` : '/api/stats',
    [companyId]
  )
  const stats = statsData?.totals || {}

  async function handleGenerate() {
    if (!companyId) {
      toast.error('Selecione uma empresa')
      return
    }
    setGenerating(true)
    try {
      const typeMeta = REPORT_TYPES[reportType]
      const period =
        reportType === 'weekly'
          ? `${new Date().getFullYear()}-W${Math.ceil((new Date().getDate() + new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay()) / 7)}`
          : new Date().toISOString().slice(0, 7)

      await apiPost('/api/reports', {
        companyId,
        type: reportType,
        title: `Relatório ${typeMeta.label} - ${period}`,
        period,
        summary: `${typeMeta.description}. ${stats.publishedPosts || 0} posts publicados, ${formatNumber(stats.totalReach || 0)} de alcance total, ${formatNumber(stats.totalLikes || 0)} curtidas.`,
        data: {
          stats,
          generatedAt: new Date().toISOString(),
        },
        insights: [
          `${stats.publishedPosts || 0} posts publicados no período`,
          `${formatNumber(stats.totalReach || 0)} de alcance total`,
          `${formatNumber(stats.totalLikes || 0)} curtidas acumuladas`,
          `Taxa de engajamento: ${stats.engagementRate || '0'}%`,
        ],
        format: 'pdf',
      })
      toast.success('Relatório gerado com sucesso!')
      setGenOpen(false)
      refresh()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao gerar relatório')
    } finally {
      setGenerating(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiDelete(`/api/reports/${id}`)
      toast.success('Relatório excluído')
      refresh()
    } catch {
      toast.error('Erro ao excluir')
    } finally {
      setDeleteId(null)
    }
  }

  function handleDownload(report: any) {
    // Generate a simple text-based report download
    const content = generateReportContent(report)
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.title.replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Relatório baixado')
  }

  if (!companyId) {
    return (
      <div className="space-y-6">
        <SectionHeader
          icon={FileBarChart}
          title="Relatórios"
          description="Relatórios de performance e exportações"
        />
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={FileBarChart}
              title="Selecione uma empresa"
              description="Escolha uma empresa no topo para gerar e visualizar relatórios."
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={FileBarChart}
        title="Relatórios"
        description="Gere relatórios profissionais de performance para suas empresas"
        action={
          <Button
            className="gap-2 bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90"
            onClick={() => setGenOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Gerar relatório
          </Button>
        }
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold tabular-nums">{reports.length}</p>
            <p className="text-xs text-muted-foreground">Relatórios</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold tabular-nums">{formatNumber(stats.totalReach || 0)}</p>
            <p className="text-xs text-muted-foreground">Alcance total</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold tabular-nums">{formatNumber(stats.totalLikes || 0)}</p>
            <p className="text-xs text-muted-foreground">Curtidas</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold tabular-nums">{stats.engagementRate || '0'}%</p>
            <p className="text-xs text-muted-foreground">Engajamento</p>
          </div>
        </Card>
      </div>

      {/* Report types info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(REPORT_TYPES).map(([key, meta]) => {
          const Icon = meta.icon
          return (
            <Card key={key} className="p-4 hover:shadow-md transition-shadow cursor-pointer" >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm">{meta.label}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{meta.description}</p>
            </Card>
          )
        })}
      </div>

      {/* Reports list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={FileBarChart}
              title="Nenhum relatório gerado"
              description="Gere relatórios profissionais de performance para analisar seus resultados e compartilhar com sua equipe."
              action={
                <Button
                  className="gap-2 bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90"
                  onClick={() => setGenOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  Gerar primeiro relatório
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {reports.map((report: any, i: number) => {
              const typeMeta = REPORT_TYPES[report.type] || REPORT_TYPES.weekly
              const TypeIcon = typeMeta.icon
              let insights: string[] = []
              try {
                insights = JSON.parse(report.insights || '[]')
              } catch {
                insights = []
              }
              return (
                <motion.div
                  key={report.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                >
                  <Card className="group hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${typeMeta.color}20`, color: typeMeta.color }}
                        >
                          <TypeIcon className="w-5 h-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-sm">{report.title}</h3>
                            <Badge variant="secondary" className="text-[9px]">
                              {typeMeta.label}
                            </Badge>
                            <Badge
                              className={cn(
                                'text-[9px] gap-0.5',
                                report.status === 'ready'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              )}
                            >
                              {report.status === 'ready' ? (
                                <CheckCircle2 className="w-2.5 h-2.5" />
                              ) : (
                                <Clock className="w-2.5 h-2.5" />
                              )}
                              {report.status === 'ready' ? 'Pronto' : 'Gerando...'}
                            </Badge>
                          </div>

                          {report.summary && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{report.summary}</p>
                          )}

                          {insights.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {insights.slice(0, 3).map((insight: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                                >
                                  {insight}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDateTime(report.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileType className="w-3 h-3" />
                              {report.format.toUpperCase()}
                            </span>
                            <span>Período: {report.period}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {report.status === 'ready' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs gap-1.5"
                              onClick={() => handleDownload(report)}
                            >
                              <Download className="w-3.5 h-3.5" />
                              Baixar
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-opacity"
                            onClick={() => setDeleteId(report.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Generate dialog */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center">
                <FileBarChart className="w-4 h-4 text-white" />
              </div>
              Gerar relatório
            </DialogTitle>
            <DialogDescription>
              Escolha o tipo de relatório. Ele será gerado com os dados mais recentes da empresa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {Object.entries(REPORT_TYPES).map(([key, meta]) => {
              const Icon = meta.icon
              return (
                <button
                  key={key}
                  onClick={() => setReportType(key)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all',
                    reportType === key
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{meta.label}</p>
                    <p className="text-xs text-muted-foreground">{meta.description}</p>
                  </div>
                  {reportType === key && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                </button>
              )
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="gap-2 bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar agora
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este relatório?</AlertDialogTitle>
            <AlertDialogDescription>
              O relatório será removido permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 hover:bg-rose-600 text-white"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function generateReportContent(report: any): string {
  let insights: string[] = []
  let data: any = {}
  try {
    insights = JSON.parse(report.insights || '[]')
  } catch {}
  try {
    data = JSON.parse(report.data || '{}')
  } catch {}

  const stats = data.stats || {}
  const lines = [
    '═══════════════════════════════════════════════════════',
    '           SOCIALHUB — RELATÓRIO DE PERFORMANCE          ',
    '═══════════════════════════════════════════════════════',
    '',
    `Título: ${report.title}`,
    `Tipo: ${report.type}`,
    `Período: ${report.period}`,
    `Gerado em: ${formatDateTime(report.createdAt)}`,
    '',
    '─── RESUMO ──────────────────────────────────────────────',
    report.summary || 'Sem resumo disponível.',
    '',
    '─── MÉTRICAS PRINCIPAIS ─────────────────────────────────',
    `Posts publicados:     ${stats.publishedPosts || 0}`,
    `Posts agendados:      ${stats.scheduledPosts || 0}`,
    `Rascunhos:            ${stats.drafts || 0}`,
    `Alcance total:        ${formatNumber(stats.totalReach || 0)}`,
    `Curtidas totais:      ${formatNumber(stats.totalLikes || 0)}`,
    `Comentários:          ${formatNumber(stats.totalComments || 0)}`,
    `Compartilhamentos:    ${formatNumber(stats.totalShares || 0)}`,
    `Impressões:           ${formatNumber(stats.totalImpressions || 0)}`,
    `Taxa de engajamento:  ${stats.engagementRate || '0'}%`,
    `Contas conectadas:    ${stats.accounts || 0}`,
    '',
    '─── INSIGHTS DA IA ──────────────────────────────────────',
    ...insights.map((i: string) => `• ${i}`),
    '',
    '─── RECOMENDAÇÕES ──────────────────────────────────────',
    '• Continue publicando consistentemente para manter o engajamento',
    '• Analise os horários de melhor performance para otimizar o agendamento',
    '• Monitore menções e responda rapidamente para fortalecer a marca',
    '• Use as hashtags de melhor performance em posts futuros',
    '',
    '═══════════════════════════════════════════════════════',
    '  Relatório gerado pelo SocialHub — Gestão de Redes    ',
    '═══════════════════════════════════════════════════════',
  ]
  return lines.join('\n')
}
