'use client'

import { useEffect, useMemo, useState } from 'react'
import { useFetch, apiPost } from '@/lib/hooks'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { PlatformIcon } from '@/lib/platform-icons'
import {
  PLATFORMS,
  PLATFORM_META,
  POST_CATEGORIES,
  TONES,
  type Platform,
} from '@/lib/types'
import { SectionHeader, EmptyState, PlatformBadge } from '@/components/shared/ui'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Copy,
  Check,
  Hash,
  Save,
  Search as SearchIcon,
  Clock,
  Wand2,
  FileText,
  ChevronDown,
  Loader2,
  ImageIcon,
  X,
  Plus,
} from 'lucide-react'

const TONE_LABELS: Record<string, string> = {
  profissional: 'Profissional',
  casual: 'Casual',
  divertido: 'Divertido',
  inspirador: 'Inspirador',
  autoridade: 'Autoridade',
  empático: 'Empático',
  vendas: 'Vendas',
}

interface GeneratedResult {
  caption: string
  hashtags: string[]
  variations: Record<string, string>
}

export function CreatorSection() {
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId)
  const setSection = useAppStore((s) => s.setSection)
  const creatorPrefill = useAppStore((s) => s.creatorPrefill)
  const clearCreatorPrefill = useAppStore((s) => s.clearCreatorPrefill)

  const { data: companiesData } = useFetch<{ companies: any[] }>(
    '/api/companies',
    []
  )
  const companies = companiesData?.companies || []

  const [companyOverride, setCompanyOverride] = useState<string | null>(null)
  const companyId = companyOverride ?? selectedCompanyId ?? ''
  const selectedCompany = companies.find((c) => c.id === companyId)

  const templatesUrl = companyId ? `/api/templates?companyId=${companyId}` : null
  const { data: templatesData } = useFetch<{ templates: any[] }>(templatesUrl, [
    companyId,
  ])
  const templates = templatesData?.templates || []

  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState<string>('profissional')
  const [category, setCategory] = useState<string>('promocional')
  const [platforms, setPlatforms] = useState<string[]>([
    'instagram',
    'facebook',
  ])
  const [keywords, setKeywords] = useState('')
  const [attachedMedia, setAttachedMedia] = useState<string[]>([])
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)

  // Apply prefill from Ideas section
  useEffect(() => {
    if (creatorPrefill) {
      if (creatorPrefill.topic) setTopic(creatorPrefill.topic)
      if (creatorPrefill.category) setCategory(creatorPrefill.category)
      if (creatorPrefill.platforms?.length) setPlatforms(creatorPrefill.platforms as string[])
      clearCreatorPrefill()
    }
  }, [creatorPrefill, clearCreatorPrefill])

  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<GeneratedResult | null>(null)

  const [seoLoading, setSeoLoading] = useState(false)
  const [seoOpen, setSeoOpen] = useState(false)
  const [seoResult, setSeoResult] = useState<any>(null)

  const [timesLoading, setTimesLoading] = useState(false)
  const [timesOpen, setTimesOpen] = useState(false)
  const [bestTimes, setBestTimes] = useState<Record<string, any[]> | null>(null)

  const [saveOpen, setSaveOpen] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [saveStatus, setSaveStatus] = useState<string>('scheduled')
  const [saving, setSaving] = useState(false)

  const togglePlatform = (p: string) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }

  const kwArr = useMemo(
    () =>
      keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
    [keywords]
  )

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Informe um tópico ou mensagem')
      return
    }
    if (!companyId) {
      toast.error('Selecione uma empresa')
      return
    }
    if (platforms.length === 0) {
      toast.error('Selecione ao menos uma plataforma')
      return
    }
    setGenerating(true)
    setResult(null)
    setSeoResult(null)
    setBestTimes(null)
    try {
      const res = await apiPost<{ result: GeneratedResult }>('/api/ai/generate', {
        topic,
        company: selectedCompany?.name || '',
        niche: selectedCompany?.niche || '',
        tone,
        platforms,
        keywords: kwArr,
      })
      setResult(res.result)
      toast.success('Conteúdo gerado com sucesso!')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao gerar conteúdo')
    } finally {
      setGenerating(false)
    }
  }

  const applyTemplate = (templateId: string) => {
    const t = templates.find((x) => x.id === templateId)
    if (!t) return
    setTopic((prev) =>
      prev
        ? `${prev}\n\n[Estrutura sugerida: ${t.structure}]`
        : `[Estrutura sugerida: ${t.structure}]`
    )
    if (t.tone) setTone(t.tone)
    if (t.category) setCategory(t.category)
    toast.success(`Template "${t.name}" aplicado`)
  }

  const handleSeo = async () => {
    if (!result?.caption) {
      toast.error('Gere o conteúdo primeiro')
      return
    }
    setSeoLoading(true)
    setSeoOpen(true)
    try {
      const res = await apiPost<{ result: any }>('/api/ai/seo', {
        topic,
        company: selectedCompany?.name || '',
        website: selectedCompany?.website || '',
        niche: selectedCompany?.niche || '',
        content: result.caption,
      })
      setSeoResult(res.result)
      toast.success('Análise SEO concluída')
    } catch (e: any) {
      toast.error(e?.message || 'Erro na análise SEO')
    } finally {
      setSeoLoading(false)
    }
  }

  const handleBestTimes = async () => {
    if (!selectedCompany?.niche) {
      toast.error('Selecione uma empresa com nicho definido')
      return
    }
    if (platforms.length === 0) {
      toast.error('Selecione plataformas')
      return
    }
    setTimesLoading(true)
    setTimesOpen(true)
    try {
      const res = await apiPost<{ result: Record<string, any[]> }>(
        '/api/ai/best-times',
        {
          niche: selectedCompany.niche,
          platforms,
        }
      )
      setBestTimes(res.result)
      toast.success('Horários recomendados gerados')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao gerar horários')
    } finally {
      setTimesLoading(false)
    }
  }

  const handleSave = async () => {
    if (!result || !companyId) return
    setSaving(true)
    try {
      await apiPost('/api/posts', {
        companyId,
        title: topic.slice(0, 100) || 'Post gerado por IA',
        content: result.caption,
        hashtags: result.hashtags || [],
        mediaUrls: attachedMedia,
        platforms,
        variations: result.variations || {},
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        status: saveStatus,
        category,
        tone,
      })
      toast.success('Post salvo com sucesso!')
      setSaveOpen(false)
      setSection('posts')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar post')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Sparkles}
        title="Criador de Conteúdo com IA"
        description="Gere legendas, variações por plataforma, hashtags e otimização SEO"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Form */}
        <Card className="p-5 sm:p-6 space-y-4 self-start lg:sticky lg:top-4">
          <div>
            <Label>Empresa</Label>
            <Select value={companyId} onValueChange={setCompanyOverride}>
              <SelectTrigger className="w-full mt-1.5">
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: c.brandColor || '#7C3AED' }}
                      />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCompany?.niche && (
              <p className="text-xs text-muted-foreground mt-1">
                Nicho: {selectedCompany.niche}
                {selectedCompany.website ? ` • ${selectedCompany.website}` : ''}
              </p>
            )}
          </div>

          {templates.length > 0 && (
            <div>
              <Label>Templates</Label>
              <Select onValueChange={applyTemplate}>
                <SelectTrigger className="w-full mt-1.5">
                  <SelectValue placeholder="Aplicar um template (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Tópico / Mensagem</Label>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={4}
              placeholder="Ex: Lançamento da nova coleção de verão com 20% de desconto..."
              className="mt-1.5 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {topic.length} caracteres
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Tom de voz</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="w-full mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TONE_LABELS[t] || t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POST_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Plataformas</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
              {PLATFORMS.map((p) => {
                const checked = platforms.includes(p)
                const meta = PLATFORM_META[p as Platform]
                return (
                  <label
                    key={p}
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors',
                      checked
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent/40'
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => togglePlatform(p)}
                    />
                    <PlatformIcon platform={p} className="w-4 h-4 shrink-0" />
                    <span className="text-sm truncate">{meta.label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <Label>Palavras-chave SEO</Label>
            <Input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="moda verão, desconto, coleção"
              className="mt-1.5"
            />
            {kwArr.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {kwArr.map((k, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">
                    {k}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Media attachment */}
          <div>
            <Label className="flex items-center justify-between">
              <span>Mídia anexada</span>
              <span className="text-[10px] font-normal text-muted-foreground">
                {attachedMedia.length} imagem(ns)
              </span>
            </Label>
            {attachedMedia.length > 0 ? (
              <div className="grid grid-cols-4 gap-2 mt-1.5">
                {attachedMedia.map((url, i) => (
                  <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                    <img src={url} alt={`Mídia ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setAttachedMedia((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"
                      aria-label="Remover mídia"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setMediaPickerOpen(true)}
                  className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setMediaPickerOpen(true)}
                className="w-full mt-1.5 py-3 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                Anexar imagem da biblioteca
              </button>
            )}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full gap-2 h-11 text-base"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Gerando
                conteúdo...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" /> Gerar com IA
              </>
            )}
          </Button>
        </Card>

        {/* RIGHT: Results */}
        <div className="space-y-4">
          {!result && !generating && (
            <Card className="p-6">
              <EmptyState
                icon={Wand2}
                title="Pronto para criar"
                description='Preencha o formulário ao lado e clique em "Gerar com IA" para criar legendas, hashtags e variações por plataforma.'
              />
            </Card>
          )}

          {generating && (
            <div className="space-y-4">
              <Card className="p-6 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-3/4" />
              </Card>
              <Card className="p-6 space-y-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </Card>
              <Card className="p-6 space-y-3">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-24 w-full" />
              </Card>
            </div>
          )}

          {result && !generating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Caption */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Legenda
                    principal
                  </h3>
                  <CopyButton text={result.caption} label="Legenda" />
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {result.caption}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {result.caption.length} caracteres
                </p>
              </Card>

              {/* Hashtags */}
              {result.hashtags?.length > 0 && (
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Hash className="w-4 h-4 text-primary" /> Hashtags (
                      {result.hashtags.length})
                    </h3>
                    <CopyButton
                      text={result.hashtags.map((h) => `#${h}`).join(' ')}
                      label="Hashtags"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.hashtags.map((h, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        #{h}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              {/* Variations */}
              {Object.keys(result.variations || {}).length > 0 && (
                <Card className="p-5">
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary" /> Variações por
                    plataforma
                  </h3>
                  <Accordion
                    type="single"
                    collapsible
                    defaultValue={platforms[0]}
                  >
                    {platforms.map((p) => {
                      const v = result.variations[p]
                      if (!v) return null
                      const meta = PLATFORM_META[p as Platform]
                      const over = v.length > (meta?.charLimit || 9999)
                      return (
                        <AccordionItem key={p} value={p}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-2">
                              <PlatformBadge platform={p} />
                              <span className="font-medium">
                                {meta?.label || p}
                              </span>
                              <span
                                className={cn(
                                  'text-xs font-normal',
                                  over
                                    ? 'text-rose-500'
                                    : 'text-muted-foreground'
                                )}
                              >
                                {v.length}/{meta?.charLimit}
                                {over && ' ⚠'}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="bg-muted/50 rounded-lg p-3 relative group">
                              <p className="text-sm whitespace-pre-wrap pr-8">
                                {v}
                              </p>
                              <div className="absolute top-2 right-2">
                                <CopyButton
                                  text={v}
                                  label={`Variação ${meta?.label || p}`}
                                  small
                                />
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                </Card>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setSaveOpen(true)} className="gap-2">
                  <Save className="w-4 h-4" /> Salvar como Post
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSeo}
                  disabled={seoLoading}
                  className="gap-2"
                >
                  {seoLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <SearchIcon className="w-4 h-4" />
                  )}
                  Otimizar SEO
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBestTimes}
                  disabled={timesLoading}
                  className="gap-2"
                >
                  {timesLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  Melhores horários
                </Button>
              </div>

              {/* SEO panel */}
              <Collapsible open={seoOpen} onOpenChange={setSeoOpen}>
                <CollapsibleContent className="space-y-3">
                  <Card className="p-5">
                    <h3 className="font-semibold flex items-center gap-2 mb-3">
                      <SearchIcon className="w-4 h-4 text-primary" />
                      Sugestões de SEO & Motores de IA
                    </h3>
                    {seoLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ) : seoResult ? (
                      <div className="space-y-4 text-sm">
                        {seoResult.title && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                              Title Tag
                            </p>
                            <div className="flex items-start justify-between gap-2">
                              <p className="bg-muted/50 rounded p-2 flex-1">
                                {seoResult.title}
                              </p>
                              <CopyButton
                                text={seoResult.title}
                                label="Title"
                                small
                              />
                            </div>
                          </div>
                        )}
                        {seoResult.metaDescription && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                              Meta Description
                            </p>
                            <div className="flex items-start justify-between gap-2">
                              <p className="bg-muted/50 rounded p-2 flex-1">
                                {seoResult.metaDescription}
                              </p>
                              <CopyButton
                                text={seoResult.metaDescription}
                                label="Meta description"
                                small
                              />
                            </div>
                          </div>
                        )}
                        {seoResult.keywords?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                              Palavras-chave recomendadas
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {seoResult.keywords.map((k: string, i: number) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {k}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {seoResult.googleTips?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                              Dicas para Google
                            </p>
                            <ul className="space-y-1 list-disc list-inside text-sm">
                              {seoResult.googleTips.map((t: string, i: number) => (
                                <li key={i}>{t}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {seoResult.aiEngineTips?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                              Dicas para Motores de IA (AEO/GEO)
                            </p>
                            <ul className="space-y-1 list-disc list-inside text-sm">
                              {seoResult.aiEngineTips.map(
                                (t: string, i: number) => (
                                  <li key={i}>{t}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                        {seoResult.schema && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-semibold text-muted-foreground uppercase">
                                JSON-LD Schema
                              </p>
                              <CopyButton
                                text={
                                  (() => {
                                    try {
                                      return JSON.stringify(
                                        JSON.parse(seoResult.schema),
                                        null,
                                        2
                                      )
                                    } catch {
                                      return seoResult.schema
                                    }
                                  })()
                                }
                                label="Schema JSON-LD"
                                small
                              />
                            </div>
                            <pre className="bg-zinc-900 text-zinc-100 rounded-lg p-3 text-xs overflow-x-auto max-h-72 overflow-y-auto scroll-fancy">
                              {(() => {
                                try {
                                  return JSON.stringify(
                                    JSON.parse(seoResult.schema),
                                    null,
                                    2
                                  )
                                } catch {
                                  return seoResult.schema
                                }
                              })()}
                            </pre>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhuma análise disponível.
                      </p>
                    )}
                  </Card>
                </CollapsibleContent>
              </Collapsible>

              {/* Best times panel */}
              <Collapsible open={timesOpen} onOpenChange={setTimesOpen}>
                <CollapsibleContent className="space-y-3">
                  <Card className="p-5">
                    <h3 className="font-semibold flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-primary" /> Melhores
                      horários de publicação
                    </h3>
                    {timesLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : bestTimes ? (
                      <div className="space-y-4">
                        {Object.entries(bestTimes).map(
                          ([platform, times]: [string, any[]]) => {
                            const meta =
                              PLATFORM_META[platform as Platform]
                            return (
                              <div key={platform}>
                                <div className="flex items-center gap-2 mb-2">
                                  <PlatformBadge platform={platform} />
                                  <span className="font-medium text-sm">
                                    {meta?.label || platform}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  {times.map((t, i) => (
                                    <div
                                      key={i}
                                      className="bg-muted/50 rounded-lg p-2.5"
                                    >
                                      <p className="text-xs font-semibold flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-primary" />
                                        {t.day} • {t.time}
                                      </p>
                                      <p className="text-[11px] text-muted-foreground mt-1">
                                        {t.reason}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          }
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Sem dados disponíveis.
                      </p>
                    )}
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </motion.div>
          )}
        </div>
      </div>

      {/* Save dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5 text-primary" /> Salvar como Post
            </DialogTitle>
            <DialogDescription>
              Agende a publicação ou salve como rascunho para editar depois.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Agendar para</Label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={saveStatus} onValueChange={setSaveStatus}>
                <SelectTrigger className="w-full mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media picker dialog */}
      <MediaPickerDialog
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        companyId={companyId}
        selected={attachedMedia}
        onSelect={(urls) => setAttachedMedia(urls)}
      />
    </div>
  )
}

function MediaPickerDialog({
  open,
  onOpenChange,
  companyId,
  selected,
  onSelect,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  companyId: string
  selected: string[]
  onSelect: (urls: string[]) => void
}) {
  const url = companyId ? `/api/media?companyId=${companyId}` : '/api/media'
  const { data, loading } = useFetch<{ assets: any[] }>(url, [companyId])
  const [localSel, setLocalSel] = useState<string[]>(selected)

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (open) setLocalSel(selected)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, selected])

  const assets = data?.assets || []

  const toggle = (u: string) => {
    setLocalSel((prev) => (prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u]))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" />
            Selecionar mídia da biblioteca
          </DialogTitle>
          <DialogDescription>
            {assets.length} imagens disponíveis · {localSel.length} selecionada(s)
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto scroll-fancy">
          {loading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Carregando biblioteca...</div>
          ) : assets.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              Nenhuma imagem na biblioteca. Gere imagens na seção Mídia & Imagens primeiro.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {assets.map((a) => {
                const isSel = localSel.includes(a.url)
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggle(a.url)}
                    className={cn(
                      'relative aspect-square rounded-lg overflow-hidden border-2 bg-muted transition-all',
                      isSel ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-primary/40'
                    )}
                  >
                    <img src={a.url} alt={a.title} className="w-full h-full object-cover" loading="lazy" />
                    {isSel && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    {a.source === 'ai' && (
                      <Badge className="absolute bottom-1 left-1 h-4 gap-0.5 text-[8px] bg-primary/90 backdrop-blur px-1">
                        <Sparkles className="w-2 h-2" /> IA
                      </Badge>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onSelect(localSel)
              onOpenChange(false)
              toast.success(`${localSel.length} mídia(s) anexada(s)`)
            }}
            disabled={localSel.length === 0}
            className="gap-2"
          >
            <Check className="w-4 h-4" />
            Anexar {localSel.length} {localSel.length === 1 ? 'imagem' : 'imagens'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CopyButton({
  text,
  label,
  small,
}: {
  text: string
  label: string
  small?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(`${label} copiado!`)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Não foi possível copiar')
    }
  }
  return (
    <Button
      variant="ghost"
      size={small ? 'icon' : 'sm'}
      onClick={handle}
      className="gap-1.5 shrink-0"
      aria-label={`Copiar ${label}`}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {!small && (copied ? 'Copiado' : 'Copiar')}
    </Button>
  )
}
