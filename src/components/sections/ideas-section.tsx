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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { SectionHeader, EmptyState, PlatformBadge } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lightbulb,
  Sparkles,
  Trash2,
  Loader2,
  Plus,
  Flame,
  Clock,
  Calendar,
  ArrowRight,
  Wand2,
  Filter,
  TrendingUp,
} from 'lucide-react'

const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  educacional: { label: 'Educacional', color: '#0EA5E9', bg: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  engajamento: { label: 'Engajamento', color: '#10B981', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  promocional: { label: 'Promocional', color: '#F59E0B', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  storytelling: { label: 'Story', color: '#8B5CF6', bg: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300' },
  produto: { label: 'Produto', color: '#EC4899', bg: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300' },
  anuncio: { label: 'Anúncio', color: '#EF4444', bg: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
  'prova social': { label: 'Prova Social', color: '#06B6D4', bg: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300' },
  bastidores: { label: 'Bastidores', color: '#A855F7', bg: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
  tendências: { label: 'Tendências', color: '#F43F5E', bg: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
  dicas: { label: 'Dicas', color: '#14B8A6', bg: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300' },
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  idea: { label: 'Ideia', cls: 'bg-muted text-muted-foreground' },
  planned: { label: 'Planejada', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  used: { label: 'Usada', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
}

export function IdeasSection() {
  const companyId = useAppStore((s) => s.selectedCompanyId)
  const setSection = useAppStore((s) => s.setSection)
  const setSelectedCompany = useAppStore((s) => s.setSelectedCompany)

  const [genOpen, setGenOpen] = useState(false)
  const [genNiche, setGenNiche] = useState('')
  const [genPlatforms, setGenPlatforms] = useState<string[]>(['instagram', 'facebook'])
  const [genCount, setGenCount] = useState(8)
  const [generating, setGenerating] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [manualIdea, setManualIdea] = useState({ title: '', description: '', category: 'educacional', platform: 'instagram' })

  const url = companyId ? `/api/ideas?companyId=${companyId}` : '/api/ideas'
  const { data: ideasData, loading, refresh } = useFetch<any>(url, [companyId])
  const { data: compData } = useFetch<any>('/api/companies', [])

  const ideas = ideasData?.ideas || []
  const companies = compData?.companies || []
  const activeCompany = companies.find((c: any) => c.id === companyId)

  const filtered = ideas.filter((idea: any) => {
    if (search && !idea.title.toLowerCase().includes(search.toLowerCase()) && !idea.description.toLowerCase().includes(search.toLowerCase())) return false
    if (filterCat !== 'all' && idea.category !== filterCat) return false
    if (filterStatus !== 'all' && idea.status !== filterStatus) return false
    return true
  })

  // Stats
  const byStatus = {
    idea: ideas.filter((i: any) => i.status === 'idea').length,
    planned: ideas.filter((i: any) => i.status === 'planned').length,
    used: ideas.filter((i: any) => i.status === 'used').length,
  }
  const avgScore = ideas.length
    ? Math.round(ideas.reduce((a: number, i: any) => a + (i.score || 0), 0) / ideas.length)
    : 0

  async function handleGenerate() {
    if (!companyId) {
      toast.error('Selecione uma empresa no topo da tela primeiro')
      return
    }
    if (!genNiche.trim() && !activeCompany?.niche) {
      toast.error('Informe o nicho da empresa')
      return
    }
    setGenerating(true)
    try {
      const res = await apiPost<any>('/api/ideas/generate', {
        company: activeCompany?.name || 'Empresa',
        niche: genNiche.trim() || activeCompany?.niche || 'geral',
        platforms: genPlatforms,
        count: genCount,
        companyId,
        save: true,
      })
      toast.success(`${res.count} ideias geradas! 💡`)
      setGenOpen(false)
      setGenNiche('')
      refresh()
    } catch (e: any) {
      toast.error(e.message || 'Falha ao gerar ideias')
    } finally {
      setGenerating(false)
    }
  }

  async function toggleStatus(idea: any) {
    const next = idea.status === 'idea' ? 'planned' : idea.status === 'planned' ? 'used' : 'idea'
    try {
      await apiPost(`/api/ideas?id=${idea.id}`, { status: next })
      refresh()
    } catch {
      toast.error('Erro ao atualizar')
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiDelete(`/api/ideas?id=${id}`)
      toast.success('Ideia excluída')
      refresh()
    } catch {
      toast.error('Erro ao excluir')
    } finally {
      setDeleteId(null)
    }
  }

  async function handleAddManual() {
    if (!manualIdea.title.trim() || !manualIdea.description.trim()) {
      toast.error('Preencha título e descrição')
      return
    }
    try {
      await apiPost('/api/ideas', { ...manualIdea, companyId })
      toast.success('Ideia adicionada')
      setAddOpen(false)
      setManualIdea({ title: '', description: '', category: 'educacional', platform: 'instagram' })
      refresh()
    } catch {
      toast.error('Erro ao adicionar')
    }
  }

  function togglePlatform(p: string) {
    setGenPlatforms((arr) => (arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p]))
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Banco de Ideias"
        description="Nunca mais fique sem ideias. Gere um calendário de conteúdo com IA."
        icon={Lightbulb}
        action={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Ideia manual</span>
            </Button>
            <Button
              className="gap-2 bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90"
              onClick={() => setGenOpen(true)}
            >
              <Sparkles className="w-4 h-4" />
              Gerar com IA
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold tabular-nums">{ideas.length}</p>
            <p className="text-xs text-muted-foreground">Total de ideias</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold tabular-nums">{byStatus.idea}</p>
            <p className="text-xs text-muted-foreground">A explorar</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold tabular-nums">{byStatus.planned}</p>
            <p className="text-xs text-muted-foreground">Planejadas</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-fuchsia-500/10 text-fuchsia-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold tabular-nums">{avgScore}</p>
            <p className="text-xs text-muted-foreground">Score médio</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar ideias..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {Object.entries(CATEGORY_META).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="idea">Ideia</SelectItem>
              <SelectItem value="planned">Planejada</SelectItem>
              <SelectItem value="used">Usada</SelectItem>
            </SelectContent>
          </Select>
          {companyId && (
            <Button variant="ghost" size="sm" className="h-9" onClick={() => setSelectedCompany(null)}>
              Limpar filtro
            </Button>
          )}
        </div>
      </Card>

      {/* Ideas list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Lightbulb}
              title={ideas.length === 0 ? 'Nenhuma ideia ainda' : 'Nenhuma ideia encontrada'}
              description={
                ideas.length === 0
                  ? 'Gere um calendário de ideias de conteúdo com IA baseado no nicho da sua empresa, ou adicione ideias manualmente.'
                  : 'Ajuste os filtros para ver mais ideias.'
              }
              action={
                ideas.length === 0 ? (
                  <Button
                    className="gap-2 bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90"
                    onClick={() => setGenOpen(true)}
                  >
                    <Sparkles className="w-4 h-4" />
                    Gerar ideias com IA
                  </Button>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <AnimatePresence>
            {filtered.map((idea: any, i: number) => {
              const catMeta = CATEGORY_META[idea.category] || CATEGORY_META.educacional
              const statusMeta = STATUS_META[idea.status] || STATUS_META.idea
              return (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="group relative rounded-xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/40 transition-all"
                >
                  {/* Left color stripe */}
                  <div
                    className="absolute left-0 top-4 bottom-4 w-1 rounded-full"
                    style={{ backgroundColor: catMeta.color }}
                  />
                  <div className="pl-2">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: `${catMeta.color}20`, color: catMeta.color }}
                          >
                            {catMeta.label}
                          </span>
                          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', statusMeta.cls)}>
                            {statusMeta.label}
                          </span>
                          {idea.score >= 80 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                              <Flame className="w-2.5 h-2.5" />
                              Hot
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm leading-tight">{idea.title}</h3>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <div className="relative w-9 h-9">
                          <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15" fill="none" stroke="var(--muted)" strokeWidth="3" />
                            <circle
                              cx="18"
                              cy="18"
                              r="15"
                              fill="none"
                              stroke={idea.score >= 80 ? '#F43F5E' : idea.score >= 60 ? '#10B981' : '#6B7280'}
                              strokeWidth="3"
                              strokeDasharray={`${(idea.score / 100) * 94.2} 94.2`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                            {idea.score}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2.5">{idea.description}</p>

                    {idea.angle && (
                      <div className="text-[11px] text-muted-foreground italic mb-2 line-clamp-1">
                        💡 {idea.angle}
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground mb-2.5">
                      <span className="flex items-center gap-1">
                        <PlatformBadge platform={idea.platform} />
                        {idea.platform}
                      </span>
                      {idea.bestDay && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {idea.bestDay}
                        </span>
                      )}
                      {idea.bestTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {idea.bestTime}
                        </span>
                      )}
                    </div>

                    {idea.hashtags && (() => {
                      let tags: string[] = []
                      try {
                        tags = JSON.parse(idea.hashtags)
                      } catch {
                        tags = []
                      }
                      return tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mb-2.5">
                          {tags.slice(0, 4).map((t: string) => (
                            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                              #{t}
                            </span>
                          ))}
                          {tags.length > 4 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              +{tags.length - 4}
                            </span>
                          )}
                        </div>
                      ) : null
                    })()}

                    <div className="flex items-center gap-1.5 pt-1 border-t border-border">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1 flex-1"
                        onClick={() => toggleStatus(idea)}
                      >
                        {idea.status === 'idea' && <Calendar className="w-3 h-3" />}
                        {idea.status === 'planned' && <Flame className="w-3 h-3" />}
                        {idea.status === 'used' && <Lightbulb className="w-3 h-3" />}
                        {idea.status === 'idea' ? 'Planejar' : idea.status === 'planned' ? 'Marcar usada' : 'Reabrir'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1"
                        onClick={() => {
                          if (companyId !== idea.companyId) setSelectedCompany(idea.companyId)
                          setSection('creator')
                          toast.success('Use a ideia como tópico no criador')
                        }}
                      >
                        <ArrowRight className="w-3 h-3" />
                        Criar
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-7 h-7 opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-opacity"
                        onClick={() => setDeleteId(idea.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
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
                <Wand2 className="w-4 h-4 text-white" />
              </div>
              Gerar ideias com IA
            </DialogTitle>
            <DialogDescription>
              A IA criará um conjunto de ideias de conteúdo personalizadas para o nicho da empresa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!companyId && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 text-xs text-amber-700 dark:text-amber-300">
                Selecione uma empresa no topo da tela para associar as ideias.
              </div>
            )}
            {activeCompany && (
              <div className="rounded-lg bg-muted/50 p-3 text-xs">
                <p className="text-muted-foreground">Empresa ativa</p>
                <p className="font-semibold">{activeCompany.name}</p>
                <p className="text-muted-foreground mt-0.5">Nicho: {activeCompany.niche || '—'}</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Nicho (sobrescrever)</Label>
              <Input
                value={genNiche}
                onChange={(e) => setGenNiche(e.target.value)}
                placeholder={activeCompany?.niche || 'Ex: Gastronomia / Cafeteria'}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Plataformas-alvo</Label>
              <div className="flex flex-wrap gap-1.5">
                {['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok', 'youtube'].map((p) => (
                  <button
                    key={p}
                    onClick={() => togglePlatform(p)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all',
                      genPlatforms.includes(p)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/40'
                    )}
                  >
                    <PlatformBadge platform={p} />
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Quantidade: {genCount} ideias</Label>
              <input
                type="range"
                min={4}
                max={12}
                value={genCount}
                onChange={(e) => setGenCount(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="gap-2 bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90"
              onClick={handleGenerate}
              disabled={generating || !companyId}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar {genCount} ideias
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
              Adicionar ideia manual
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Título *</Label>
              <Input
                value={manualIdea.title}
                onChange={(e) => setManualIdea({ ...manualIdea, title: e.target.value })}
                placeholder="Ex: Bastidores da produção"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Descrição *</Label>
              <Textarea
                value={manualIdea.description}
                onChange={(e) => setManualIdea({ ...manualIdea, description: e.target.value })}
                placeholder="Descreva a ideia..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Categoria</Label>
                <Select
                  value={manualIdea.category}
                  onValueChange={(v) => setManualIdea({ ...manualIdea, category: v })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_META).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Plataforma</Label>
                <Select
                  value={manualIdea.platform}
                  onValueChange={(v) => setManualIdea({ ...manualIdea, platform: v })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok', 'youtube'].map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddManual}>Adicionar ideia</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta ideia?</AlertDialogTitle>
            <AlertDialogDescription>
              A ideia será removida permanentemente. Esta ação não pode ser desfeita.
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
