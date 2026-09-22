'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { useFetch, apiPost, apiDelete } from '@/lib/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { SectionHeader, EmptyState } from '@/components/shared/ui'
import { cn, formatNumber } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  Sparkles,
  Plus,
  Trash2,
  Loader2,
  Wand2,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Zap,
  Users,
  Heart,
  MessageCircle,
  AlertTriangle,
  Shield,
  ArrowUpRight,
  Eye,
  Flame,
  CheckCircle2,
} from 'lucide-react'

const THREAT_META: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  high: { label: 'Alto', color: '#EF4444', bg: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300', icon: AlertTriangle },
  medium: { label: 'Médio', color: '#F59E0B', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', icon: Shield },
  low: { label: 'Baixo', color: '#10B981', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', icon: CheckCircle2 },
}

const ENGAGEMENT_META: Record<string, { color: string; label: string }> = {
  alto: { color: '#10B981', label: 'Alto' },
  'médio': { color: '#F59E0B', label: 'Médio' },
  'medio': { color: '#F59E0B', label: 'Médio' },
  baixo: { color: '#EF4444', label: 'Baixo' },
}

function safeParse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback
  try {
    const v = JSON.parse(s)
    return Array.isArray(v) ? v : fallback
  } catch {
    return fallback
  }
}

export function CompetitorsSection() {
  const companyId = useAppStore((s) => s.selectedCompanyId)
  const setSection = useAppStore((s) => s.setSection)

  const [analyzeOpen, setAnalyzeOpen] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [insights, setInsights] = useState<any>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [manualForm, setManualForm] = useState({
    name: '',
    handle: '',
    website: '',
    threatLevel: 'medium',
    notes: '',
  })

  const { data: compData } = useFetch<{ companies: any[] }>('/api/companies', [])
  const companies = compData?.companies || []
  const activeCompany = companies.find((c: any) => c.id === companyId)

  const url = companyId ? `/api/competitors?companyId=${companyId}` : null
  const { data, loading, refresh } = useFetch<any>(url, [companyId])
  const competitors = data?.competitors || []

  const highThreat = competitors.filter((c: any) => c.threatLevel === 'high').length
  const totalReach = competitors.reduce((a: number, c: any) => a + (c.followers || 0), 0)
  const avgEngagement =
    competitors.length > 0
      ? (competitors.reduce((a: number, c: any) => a + (c.engagementRate || 0), 0) / competitors.length).toFixed(1)
      : '0'

  async function handleAnalyze() {
    if (!companyId) {
      toast.error('Selecione uma empresa no topo')
      return
    }
    if (!activeCompany?.niche) {
      toast.error('A empresa precisa ter um nicho definido')
      return
    }
    setAnalyzing(true)
    setInsights(null)
    try {
      const res = await apiPost<any>('/api/competitors/analyze', {
        company: activeCompany.name,
        niche: activeCompany.niche,
        location: activeCompany.city || 'Brasil',
        companyId,
        save: true,
      })
      toast.success(`${res.count} concorrentes analisados!`)
      setAnalyzeOpen(false)
      setInsights(res.insights)
      refresh()
    } catch (e: any) {
      toast.error(e.message || 'Falha na análise')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleAddManual() {
    if (!manualForm.name.trim() || !companyId) {
      toast.error('Nome é obrigatório')
      return
    }
    try {
      await apiPost('/api/competitors', {
        companyId,
        name: manualForm.name,
        handle: manualForm.handle || undefined,
        website: manualForm.website || undefined,
        niche: activeCompany?.niche,
        threatLevel: manualForm.threatLevel,
        notes: manualForm.notes || undefined,
      })
      toast.success('Concorrente adicionado')
      setAddOpen(false)
      setManualForm({ name: '', handle: '', website: '', threatLevel: 'medium', notes: '' })
      refresh()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao adicionar')
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiDelete(`/api/competitors?id=${id}`)
      toast.success('Concorrente removido')
      refresh()
    } catch {
      toast.error('Erro ao excluir')
    } finally {
      setDeleteId(null)
    }
  }

  if (!companyId) {
    return (
      <div className="space-y-6">
        <SectionHeader
          icon={Target}
          title="Concorrentes"
          description="Análise competitiva com IA e insights estratégicos"
        />
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Target}
              title="Selecione uma empresa"
              description="Escolha uma empresa no topo da tela para analisar seus concorrentes e obter insights estratégicos."
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Target}
        title="Concorrentes"
        description={`Análise competitiva para ${activeCompany?.name || ''}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Adicionar</span>
            </Button>
            <Button
              className="gap-2 bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90"
              onClick={() => setAnalyzeOpen(true)}
            >
              <Sparkles className="w-4 h-4" />
              Analisar com IA
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold tabular-nums">{competitors.length}</p>
            <p className="text-xs text-muted-foreground">Concorrentes</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold tabular-nums">{highThreat}</p>
            <p className="text-xs text-muted-foreground">Ameaça alta</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold tabular-nums">{formatNumber(totalReach)}</p>
            <p className="text-xs text-muted-foreground">Alcance total</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold tabular-nums">{avgEngagement}%</p>
            <p className="text-xs text-muted-foreground">Engaj. médio</p>
          </div>
        </Card>
      </div>

      {/* Insights panel */}
      {insights && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  Insights estratégicos da IA
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setInsights(null)}>
                  Fechar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InsightColumn
                  title="Lacunas de mercado"
                  items={insights.marketGaps}
                  icon={Target}
                  color="#EF4444"
                />
                <InsightColumn
                  title="Oportunidades de conteúdo"
                  items={insights.contentOpportunities}
                  icon={Lightbulb}
                  color="#F59E0B"
                />
                <InsightColumn
                  title="Dicas de diferenciação"
                  items={insights.differentiationTips}
                  icon={Zap}
                  color="#10B981"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Competitors grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : competitors.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Target}
              title="Nenhum concorrente analisado"
              description="Use a IA para analisar automaticamente os concorrentes da sua empresa, identificar pontos fortes/fracos e descobrir oportunidades de mercado."
              action={
                <Button
                  className="gap-2 bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90"
                  onClick={() => setAnalyzeOpen(true)}
                >
                  <Sparkles className="w-4 h-4" />
                  Analisar com IA
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {competitors.map((comp: any, i: number) => {
              const threat = THREAT_META[comp.threatLevel] || THREAT_META.medium
              const ThreatIcon = threat.icon
              const strengths = safeParse<string[]>(comp.strengths, [])
              const weaknesses = safeParse<string[]>(comp.weaknesses, [])
              const themes = safeParse<string[]>(comp.contentThemes, [])
              return (
                <motion.div
                  key={comp.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(i * 0.05, 0.3) }}
                >
                  <Card className="group relative overflow-hidden h-full hover:shadow-lg transition-shadow">
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: threat.color }}
                    />
                    <CardContent className="p-5 pt-6 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-white"
                            style={{ backgroundColor: threat.color }}
                          >
                            {comp.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{comp.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {comp.handle || comp.website || '—'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge className={cn('gap-1 text-[10px]', threat.bg)}>
                            <ThreatIcon className="w-2.5 h-2.5" />
                            {threat.label}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-7 h-7 opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-opacity"
                            onClick={() => setDeleteId(comp.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        <Stat icon={Users} label="Seguidores" value={formatNumber(comp.followers || 0)} />
                        <Stat icon={Heart} label="Curtidas" value={formatNumber(comp.avgLikes || 0)} />
                        <Stat icon={MessageCircle} label="Comentários" value={formatNumber(comp.avgComments || 0)} />
                      </div>

                      {/* Engagement + frequency */}
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted">
                          <TrendingUp className="w-3 h-3" />
                          Engaj. {(comp.engagementRate || 0).toFixed(1)}%
                        </span>
                        {comp.postingFrequency && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted">
                            <Flame className="w-3 h-3" />
                            {comp.postingFrequency}
                          </span>
                        )}
                      </div>

                      <Separator />

                      {/* Strengths */}
                      {strengths.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Pontos fortes
                          </p>
                          <ul className="space-y-0.5">
                            {strengths.slice(0, 3).map((s, idx) => (
                              <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <span className="text-emerald-500 mt-0.5">•</span>
                                <span className="line-clamp-1">{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Weaknesses */}
                      {weaknesses.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mb-1.5 flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" />
                            Pontos fracos
                          </p>
                          <ul className="space-y-0.5">
                            {weaknesses.slice(0, 3).map((w, idx) => (
                              <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <span className="text-rose-500 mt-0.5">•</span>
                                <span className="line-clamp-1">{w}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Content themes */}
                      {themes.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Temas de conteúdo</p>
                          <div className="flex flex-wrap gap-1">
                            {themes.slice(0, 4).map((t, idx) => (
                              <Badge key={idx} variant="secondary" className="text-[9px]">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Opportunity note */}
                      {comp.notes && (
                        <div className="rounded-lg bg-primary/5 border border-primary/20 p-2.5">
                          <p className="text-[11px] font-semibold text-primary mb-0.5 flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" />
                            Oportunidade
                          </p>
                          <p className="text-xs text-muted-foreground">{comp.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Analyze dialog */}
      <Dialog open={analyzeOpen} onOpenChange={setAnalyzeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center">
                <Wand2 className="w-4 h-4 text-white" />
              </div>
              Análise de concorrentes com IA
            </DialogTitle>
            <DialogDescription>
              A IA identificará concorrentes do nicho, analisará pontos fortes/fracos e descobrirá oportunidades de mercado.
            </DialogDescription>
          </DialogHeader>
          {activeCompany && (
            <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
              <p><span className="text-muted-foreground">Empresa:</span> <span className="font-semibold">{activeCompany.name}</span></p>
              <p><span className="text-muted-foreground">Nicho:</span> {activeCompany.niche || '—'}</p>
              <p><span className="text-muted-foreground">Local:</span> {activeCompany.city || 'Brasil'}</p>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            A análise gerará 4 perfis de concorrentes com: pontos fortes, fracos, temas de conteúdo,
            frequência de postagem, nível de ameaça e oportunidades de diferenciação. Também incluirá
            insights estratégicos: lacunas de mercado, oportunidades de conteúdo e dicas de diferenciação.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnalyzeOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="gap-2 bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analisar agora
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add manual dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              Adicionar concorrente manualmente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome *</Label>
              <Input
                value={manualForm.name}
                onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                placeholder="Ex: Café Concorrente LTDA"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Handle</Label>
                <Input
                  value={manualForm.handle}
                  onChange={(e) => setManualForm({ ...manualForm, handle: e.target.value })}
                  placeholder="@concorrente"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Website</Label>
                <Input
                  value={manualForm.website}
                  onChange={(e) => setManualForm({ ...manualForm, website: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nível de ameaça</Label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(THREAT_META).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => setManualForm({ ...manualForm, threatLevel: k })}
                    className={cn(
                      'flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all',
                      manualForm.threatLevel === k
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                        : 'border-border hover:border-primary/40'
                    )}
                    style={manualForm.threatLevel === k ? { color: v.color } : undefined}
                  >
                    <v.icon className="w-3 h-3" />
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notas / Oportunidade</Label>
              <Textarea
                value={manualForm.notes}
                onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                placeholder="Como sua empresa pode se diferenciar..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddManual}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover este concorrente?</AlertDialogTitle>
            <AlertDialogDescription>
              O concorrente será removido da sua análise. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 hover:bg-rose-600 text-white"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2 text-center">
      <Icon className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-0.5" />
      <p className="text-sm font-bold tabular-nums">{value}</p>
      <p className="text-[9px] text-muted-foreground">{label}</p>
    </div>
  )
}

function InsightColumn({
  title,
  items,
  icon: Icon,
  color,
}: {
  title: string
  items: string[]
  icon: any
  color: string
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color }}>
        <Icon className="w-3.5 h-3.5" />
        {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
            <span style={{ color }} className="mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
