'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Copy,
  Wand2,
  Info,
  Globe2,
  Bot,
  Loader2,
  KeyRound,
  Target,
  Filter,
  FileText,
  Hash,
  Lightbulb,
  Brain,
} from 'lucide-react'

import { useAppStore } from '@/lib/store'
import { useFetch, apiPost, apiDelete } from '@/lib/hooks'
import { cn, formatNumber } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { SectionHeader, EmptyState } from '@/components/shared/ui'

// ---------- Types ----------
interface Keyword {
  id: string
  keyword: string
  volume: number
  difficulty: number
  rank: number
  trend: string
  intent: string
  company?: { name: string }
}

interface SeoResult {
  title: string
  metaDescription: string
  keywords: string[]
  googleTips: string[]
  aiEngineTips: string[]
  schema: string
}

// ---------- Intent meta ----------
const INTENT_META: Record<string, { label: string; color: string; bg: string }> = {
  informational: { label: 'Informacional', color: '#0EA5E9', bg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
  commercial: { label: 'Comercial', color: '#F59E0B', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  transactional: { label: 'Transacional', color: '#10B981', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  navigational: { label: 'Navegacional', color: '#7C3AED', bg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
}

function intentMeta(intent: string) {
  return (
    INTENT_META[intent] || {
      label: intent || '—',
      color: '#64748B',
      bg: 'bg-muted text-muted-foreground',
    }
  )
}

// ---------- Difficulty helpers ----------
function difficultyColor(d: number) {
  if (d < 30) return { color: '#10B981', label: 'Fácil', textCls: 'text-emerald-600 dark:text-emerald-400' }
  if (d <= 60) return { color: '#F59E0B', label: 'Médio', textCls: 'text-amber-600 dark:text-amber-400' }
  return { color: '#EF4444', label: 'Difícil', textCls: 'text-rose-600 dark:text-rose-400' }
}

// ---------- Trend icon ----------
function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'up')
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
        <TrendingUp className="w-3.5 h-3.5" />
      </span>
    )
  if (trend === 'down')
    return (
      <span className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400">
        <TrendingDown className="w-3.5 h-3.5" />
      </span>
    )
  return (
    <span className="inline-flex items-center gap-0.5 text-muted-foreground">
      <Minus className="w-3.5 h-3.5" />
    </span>
  )
}

// ---------- Length indicator ----------
function LengthIndicator({ length, min, max }: { length: number; min: number; max: number }) {
  const ok = length >= min && length <= max
  const pct = Math.min(100, (length / max) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            ok ? 'bg-emerald-500' : length < min ? 'bg-amber-500' : 'bg-rose-500'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={cn(
          'text-[11px] font-semibold tabular-nums',
          ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
        )}
      >
        {length}
      </span>
    </div>
  )
}

// ---------- Copy button ----------
function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Copiado para a área de transferência')
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error('Não foi possível copiar')
    }
  }
  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 h-7 text-xs"
      onClick={handleCopy}
    >
      {copied ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {copied ? 'Copiado' : label}
    </Button>
  )
}

// ---------- Main Component ----------
export function SeoSection() {
  const companyId = useAppStore((s) => s.selectedCompanyId)

  // Companies list (for company/niche/website lookup on the optimizer side)
  const companiesUrl = '/api/companies'
  const { data: companiesData } = useFetch<any>(companiesUrl, [])
  const companies = companiesData?.companies || []

  // Resolve the "active" company: selected one, else first
  const activeCompany = useMemo(() => {
    if (companyId) {
      return companies.find((c: any) => c.id === companyId) || null
    }
    return companies[0] || null
  }, [companyId, companies])

  // ---------------- Keywords side ----------------
  const keywordsUrl = companyId
    ? `/api/seo-keywords?companyId=${companyId}`
    : '/api/seo-keywords'
  const { data: kwData, loading: kwLoading, error: kwError, refresh: refreshKeywords } = useFetch<{
    keywords: Keyword[]
  }>(keywordsUrl, [companyId])

  const keywords = kwData?.keywords || []

  const [search, setSearch] = useState('')
  const [intentFilter, setIntentFilter] = useState<string>('all')

  const filteredKeywords = useMemo(() => {
    return keywords.filter((k) => {
      const matchesSearch =
        !search || k.keyword.toLowerCase().includes(search.toLowerCase())
      const matchesIntent = intentFilter === 'all' || k.intent === intentFilter
      return matchesSearch && matchesIntent
    })
  }, [keywords, search, intentFilter])

  // AI keyword research dialog state
  const [aiKwOpen, setAiKwOpen] = useState(false)
  const [aiNiche, setAiNiche] = useState('')
  const [aiLocation, setAiLocation] = useState('Brasil')
  const [aiKwLoading, setAiKwLoading] = useState(false)

  // Auto-fill niche when company changes
  useEffect(() => {
    if (activeCompany?.niche) setAiNiche(activeCompany.niche)
    if (activeCompany?.city) setAiLocation(activeCompany.city)
  }, [activeCompany])

  const handleAiKeywords = async () => {
    if (!activeCompany) {
      toast.error('Selecione uma empresa primeiro')
      return
    }
    if (!aiNiche.trim()) {
      toast.error('Informe o nicho da empresa')
      return
    }
    setAiKwLoading(true)
    try {
      const res = await apiPost<{ keywords: any[] }>('/api/ai/keywords', {
        company: activeCompany.name,
        niche: aiNiche,
        location: aiLocation,
        companyId: activeCompany.id,
        save: true,
      })
      toast.success(`${res.keywords?.length || 0} palavras-chave adicionadas`)
      setAiKwOpen(false)
      refreshKeywords()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao pesquisar palavras-chave')
    } finally {
      setAiKwLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/api/seo-keywords?id=${id}`)
      toast.success('Palavra-chave removida')
      refreshKeywords()
    } catch {
      toast.error('Erro ao remover palavra-chave')
    }
  }

  // ---------------- SEO Optimizer side ----------------
  const [topic, setTopic] = useState('')
  const [content, setContent] = useState('')
  const [seoLoading, setSeoLoading] = useState(false)
  const [seoResult, setSeoResult] = useState<SeoResult | null>(null)

  const handleOptimize = async () => {
    if (!activeCompany) {
      toast.error('Selecione uma empresa primeiro')
      return
    }
    if (!topic.trim()) {
      toast.error('Informe o tópico do conteúdo')
      return
    }
    setSeoLoading(true)
    setSeoResult(null)
    try {
      const res = await apiPost<{ result: SeoResult }>('/api/ai/seo', {
        topic,
        company: activeCompany.name,
        website: activeCompany.website || '',
        niche: activeCompany.niche || '',
        content,
      })
      setSeoResult(res.result)
      toast.success('Conteúdo otimizado com sucesso!')
    } catch (e: any) {
      toast.error(e.message || 'Erro ao otimizar conteúdo')
    } finally {
      setSeoLoading(false)
    }
  }

  const titleLen = seoResult?.title?.length || 0
  const metaLen = seoResult?.metaDescription?.length || 0

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Search}
        title="SEO & Motores de IA"
        description="Otimize conteúdo para Google e motores de IA (ChatGPT, AI Overviews, Perplexity)."
        action={
          <Dialog open={aiKwOpen} onOpenChange={setAiKwOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-primary to-fuchsia-600 hover:opacity-90">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Pesquisar palavras-chave com IA</span>
                <span className="sm:hidden">IA</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Pesquisa com IA
                </DialogTitle>
                <DialogDescription>
                  Gere palavras-chave de cauda longa com base no nicho da empresa. Serão salvas
                  automaticamente na lista.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Empresa</Label>
                  <div className="text-sm font-medium px-3 py-2 rounded-lg bg-muted">
                    {activeCompany?.name || 'Nenhuma empresa selecionada'}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor="ai-niche">
                    Nicho
                  </Label>
                  <Input
                    id="ai-niche"
                    value={aiNiche}
                    onChange={(e) => setAiNiche(e.target.value)}
                    placeholder="ex: cafeteria artesanal, moda sustentável"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor="ai-location">
                    Localização
                  </Label>
                  <Input
                    id="ai-location"
                    value={aiLocation}
                    onChange={(e) => setAiLocation(e.target.value)}
                    placeholder="ex: São Paulo, Brasil"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setAiKwOpen(false)} disabled={aiKwLoading}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleAiKeywords}
                  disabled={aiKwLoading || !aiNiche.trim()}
                  className="gap-2"
                >
                  {aiKwLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Gerar palavras-chave
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Info banner — AEO/GEO */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-fuchsia-500/5 to-transparent p-4 flex items-start gap-3"
      >
        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div className="text-sm">
          <p className="font-semibold mb-0.5">
            AEO & GEO — além do SEO tradicional
          </p>
          <p className="text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">AEO</span> (Answer Engine Optimization)
            e <span className="font-medium text-foreground">GEO</span> (Generative Engine
            Optimization) são estratégias para que seu conteúdo seja citado por IAs como ChatGPT,
            Google AI Overviews e Perplexity — não apenas ranqueado no Google.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* ============ LEFT — Keyword research ============ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  Pesquisa de palavras-chave
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">
                  {filteredKeywords.length} de {keywords.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Search + filter */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filtrar palavras-chave..."
                    className="pl-8 h-9"
                  />
                </div>
                <Select value={intentFilter} onValueChange={setIntentFilter}>
                  <SelectTrigger className="h-9 w-full sm:w-[170px] gap-2">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as intenções</SelectItem>
                    <SelectItem value="informational">Informacional</SelectItem>
                    <SelectItem value="commercial">Comercial</SelectItem>
                    <SelectItem value="transactional">Transacional</SelectItem>
                    <SelectItem value="navigational">Navegacional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Keywords list */}
              <div className="max-h-[640px] overflow-y-auto scroll-fancy rounded-lg border border-border">
                {kwLoading ? (
                  <div className="p-3 space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                ) : kwError ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Erro ao carregar: {kwError}
                  </div>
                ) : filteredKeywords.length === 0 ? (
                  <EmptyState
                    icon={KeyRound}
                    title={keywords.length === 0 ? 'Nenhuma palavra-chave' : 'Nenhum resultado'}
                    description={
                      keywords.length === 0
                        ? 'Use a IA para pesquisar palavras-chave para sua empresa.'
                        : 'Tente outro filtro de busca ou intenção.'
                    }
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {filteredKeywords.map((kw, i) => {
                      const dc = difficultyColor(kw.difficulty)
                      const im = intentMeta(kw.intent)
                      return (
                        <motion.li
                          key={kw.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(i * 0.03, 0.3) }}
                          className="group p-3 hover:bg-accent/40 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{kw.keyword}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {kw.company?.name || '—'}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDelete(kw.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
                              title="Remover palavra-chave"
                              aria-label={`Remover ${kw.keyword}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                            {/* Volume */}
                            <div>
                              <p className="text-muted-foreground mb-0.5">Volume</p>
                              <p className="font-semibold tabular-nums">{formatNumber(kw.volume)}</p>
                            </div>
                            {/* Difficulty with bar */}
                            <div>
                              <p className="text-muted-foreground mb-0.5">Dificuldade</p>
                              <div className="flex items-center gap-1.5">
                                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-[24px]">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${kw.difficulty}%`,
                                      backgroundColor: dc.color,
                                    }}
                                  />
                                </div>
                                <span className={cn('font-semibold tabular-nums', dc.textCls)}>
                                  {kw.difficulty}
                                </span>
                              </div>
                            </div>
                            {/* Rank */}
                            <div>
                              <p className="text-muted-foreground mb-0.5">Posição</p>
                              <p className="font-semibold tabular-nums flex items-center gap-1">
                                <TrendIcon trend={kw.trend} />
                                #{kw.rank}
                              </p>
                            </div>
                            {/* Intent */}
                            <div>
                              <p className="text-muted-foreground mb-0.5">Intenção</p>
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md',
                                  im.bg
                                )}
                              >
                                {im.label}
                              </span>
                            </div>
                          </div>
                        </motion.li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ============ RIGHT — SEO & AI Engine Optimizer ============ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="space-y-4"
        >
          {/* Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="w-7 h-7 rounded-lg bg-fuchsia-500/10 text-fuchsia-500 flex items-center justify-center">
                  <Wand2 className="w-4 h-4" />
                </span>
                Otimizador SEO & Motores de IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="seo-topic" className="text-xs flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  Tópico do conteúdo
                </Label>
                <Input
                  id="seo-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="ex: benefícios do café especial"
                  disabled={seoLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seo-company" className="text-xs flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5" />
                  Empresa
                </Label>
                <div className="text-sm font-medium px-3 py-2 rounded-lg bg-muted truncate">
                  {activeCompany?.name || 'Selecione uma empresa'}
                  {activeCompany?.niche && (
                    <span className="text-muted-foreground font-normal ml-2">
                      • {activeCompany.niche}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seo-content" className="text-xs flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Conteúdo existente <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <Textarea
                  id="seo-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Cole aqui o conteúdo que deseja otimizar..."
                  className="min-h-[88px] resize-y"
                  disabled={seoLoading}
                />
              </div>
              <Button
                onClick={handleOptimize}
                disabled={seoLoading || !topic.trim() || !activeCompany}
                className="w-full gap-2 bg-gradient-to-r from-primary to-fuchsia-600 hover:opacity-90"
              >
                {seoLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {seoLoading ? 'Otimizando...' : 'Otimizar conteúdo'}
              </Button>
            </CardContent>
          </Card>

          {/* Loading skeleton */}
          {seoLoading && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Skeleton className="h-24 w-full rounded-lg" />
                  <Skeleton className="h-24 w-full rounded-lg" />
                </div>
                <Skeleton className="h-32 w-full rounded-lg" />
              </CardContent>
            </Card>
          )}

          {/* Results */}
          <AnimatePresence mode="wait">
            {seoResult && !seoLoading && (
              <motion.div
                key="seo-result"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                {/* Title + Meta */}
                <Card>
                  <CardContent className="p-4 space-y-4">
                    {/* Title tag */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5" />
                          Title tag
                        </Label>
                        <span className="text-[10px] text-muted-foreground">
                          Ideal: 50–60 caracteres
                        </span>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                        <p className="text-sm font-medium leading-snug">{seoResult.title}</p>
                      </div>
                      <LengthIndicator length={titleLen} min={50} max={60} />
                    </div>

                    {/* Meta description */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          Meta description
                        </Label>
                        <span className="text-[10px] text-muted-foreground">
                          Ideal: 140–160 caracteres
                        </span>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {seoResult.metaDescription}
                        </p>
                      </div>
                      <LengthIndicator length={metaLen} min={140} max={160} />
                    </div>

                    {/* Keywords */}
                    {seoResult.keywords?.length > 0 && (
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5" />
                          Palavras-chave recomendadas
                        </Label>
                        <div className="flex flex-wrap gap-1.5">
                          {seoResult.keywords.map((kw, i) => (
                            <Badge
                              key={`${kw}-${i}`}
                              variant="secondary"
                              className="text-[11px] bg-primary/10 text-primary hover:bg-primary/15"
                            >
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Two zones — Google vs AI engines */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Google tips — emerald */}
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="h-full border-emerald-500/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <Globe2 className="w-4 h-4" />
                          </span>
                          Dicas para Google
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {seoResult.googleTips?.length > 0 ? (
                          <ul className="space-y-2 max-h-72 overflow-y-auto scroll-fancy pr-1">
                            {seoResult.googleTips.map((tip, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{tip}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-muted-foreground">Sem dicas disponíveis.</p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* AI engine tips — purple */}
                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <Card className="h-full border-fuchsia-500/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <span className="w-7 h-7 rounded-lg bg-fuchsia-500/10 text-fuchsia-500 flex items-center justify-center">
                            <Bot className="w-4 h-4" />
                          </span>
                          Estratégias para Motores de IA
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {seoResult.aiEngineTips?.length > 0 ? (
                          <ul className="space-y-2 max-h-72 overflow-y-auto scroll-fancy pr-1">
                            {seoResult.aiEngineTips.map((tip, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <Sparkles className="w-4 h-4 text-fuchsia-500 shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{tip}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-muted-foreground">Sem dicas disponíveis.</p>
                        )}
                        <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] gap-1 border-fuchsia-500/30 text-fuchsia-600 dark:text-fuchsia-400">
                            <Brain className="w-3 h-3" /> ChatGPT
                          </Badge>
                          <Badge variant="outline" className="text-[10px] gap-1 border-fuchsia-500/30 text-fuchsia-600 dark:text-fuchsia-400">
                            <Lightbulb className="w-3 h-3" /> AI Overviews
                          </Badge>
                          <Badge variant="outline" className="text-[10px] gap-1 border-fuchsia-500/30 text-fuchsia-600 dark:text-fuchsia-400">
                            <Search className="w-3 h-3" /> Perplexity
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* JSON-LD Schema */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </span>
                        JSON-LD Schema
                      </CardTitle>
                      <CopyButton text={seoResult.schema || ''} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="max-h-72 overflow-y-auto scroll-fancy rounded-lg bg-zinc-950 text-zinc-100 dark:bg-black/60 p-3 text-[11px] font-mono leading-relaxed">
                      <code>{seoResult.schema}</code>
                    </pre>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state on right side */}
          {!seoResult && !seoLoading && (
            <Card>
              <CardContent className="p-2">
                <EmptyState
                  icon={Sparkles}
                  title="Pronto para otimizar"
                  description="Preencha o tópico acima e clique em 'Otimizar conteúdo' para receber title tag, meta description, dicas para Google e estratégias para motores de IA."
                />
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  )
}
