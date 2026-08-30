'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Settings as SettingsIcon,
  Building2,
  Mic2,
  CalendarClock,
  Bot,
  Eye,
  Loader2,
  Save,
  Sparkles,
  Hash,
  Clock,
  Globe2,
  Image as ImageIcon,
  CheckCircle2,
  CircleAlert,
  Wand2,
  Palette,
} from 'lucide-react'

import { useAppStore } from '@/lib/store'
import { useFetch, apiPost } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { PLATFORMS, PLATFORM_META, TONES, type Platform } from '@/lib/types'
import { PlatformIcon } from '@/lib/platform-icons'
import {
  SectionHeader,
  EmptyState,
  PlatformBadge,
} from '@/components/shared/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ----------------- Types -----------------
interface CompanySettings {
  id: string
  companyId: string
  brandVoice: string | null
  targetAudience: string | null
  defaultTone: string
  defaultPlatforms: string // JSON string
  defaultHashtags: string // JSON string
  hashtagCount: number
  aiCreativity: number
  autoEmoji: boolean
  autoHashtags: boolean
  watermark: boolean
  postingFrequency: string
  bestPostingTime: string | null
  timezone: string
  createdAt: string
  updatedAt: string
}

interface FormState {
  brandVoice: string
  targetAudience: string
  defaultTone: string
  defaultPlatforms: string[]
  defaultHashtags: string[]
  hashtagCount: number
  aiCreativity: number
  autoEmoji: boolean
  autoHashtags: boolean
  watermark: boolean
  postingFrequency: string
  bestPostingTime: string
  timezone: string
}

const DEFAULT_FORM: FormState = {
  brandVoice: '',
  targetAudience: '',
  defaultTone: 'profissional',
  defaultPlatforms: [],
  defaultHashtags: [],
  hashtagCount: 8,
  aiCreativity: 70,
  autoEmoji: true,
  autoHashtags: true,
  watermark: false,
  postingFrequency: 'daily',
  bestPostingTime: '09:00',
  timezone: 'America/Sao_Paulo',
}

const TONE_LABELS: Record<string, string> = {
  profissional: 'Profissional',
  casual: 'Casual',
  divertido: 'Divertido',
  inspirador: 'Inspirador',
  autoridade: 'Autoridade',
  empático: 'Empático',
  vendas: 'Vendas',
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
}

function safeParse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback
  try {
    return JSON.parse(s) as T
  } catch {
    return fallback
  }
}

function formFromSettings(s: CompanySettings | null | undefined): FormState {
  if (!s) return { ...DEFAULT_FORM }
  return {
    brandVoice: s.brandVoice || '',
    targetAudience: s.targetAudience || '',
    defaultTone: s.defaultTone || 'profissional',
    defaultPlatforms: safeParse<string[]>(s.defaultPlatforms, []),
    defaultHashtags: safeParse<string[]>(s.defaultHashtags, []),
    hashtagCount: typeof s.hashtagCount === 'number' ? s.hashtagCount : 8,
    aiCreativity: typeof s.aiCreativity === 'number' ? s.aiCreativity : 70,
    autoEmoji: !!s.autoEmoji,
    autoHashtags: !!s.autoHashtags,
    watermark: !!s.watermark,
    postingFrequency: s.postingFrequency || 'daily',
    bestPostingTime: s.bestPostingTime || '09:00',
    timezone: s.timezone || 'America/Sao_Paulo',
  }
}

function serializeForm(f: FormState) {
  return {
    brandVoice: f.brandVoice,
    targetAudience: f.targetAudience,
    defaultTone: f.defaultTone,
    defaultPlatforms: f.defaultPlatforms,
    defaultHashtags: f.defaultHashtags,
    hashtagCount: f.hashtagCount,
    aiCreativity: f.aiCreativity,
    autoEmoji: f.autoEmoji,
    autoHashtags: f.autoHashtags,
    watermark: f.watermark,
    postingFrequency: f.postingFrequency,
    bestPostingTime: f.bestPostingTime,
    timezone: f.timezone,
  }
}

function formsEqual(a: FormState, b: FormState): boolean {
  if (a.brandVoice !== b.brandVoice) return false
  if (a.targetAudience !== b.targetAudience) return false
  if (a.defaultTone !== b.defaultTone) return false
  if (a.hashtagCount !== b.hashtagCount) return false
  if (a.aiCreativity !== b.aiCreativity) return false
  if (a.autoEmoji !== b.autoEmoji) return false
  if (a.autoHashtags !== b.autoHashtags) return false
  if (a.watermark !== b.watermark) return false
  if (a.postingFrequency !== b.postingFrequency) return false
  if (a.bestPostingTime !== b.bestPostingTime) return false
  if (a.timezone !== b.timezone) return false
  if (a.defaultPlatforms.join('|') !== b.defaultPlatforms.join('|')) return false
  if (a.defaultHashtags.join('|') !== b.defaultHashtags.join('|')) return false
  return true
}

// ----------------- Live Preview -----------------
function buildPreviewCaption(form: FormState): string {
  const tone = TONE_LABELS[form.defaultTone] || 'Profissional'
  const lines: string[] = []

  // Emoji opening if enabled
  if (form.autoEmoji) {
    const openers = ['✨', '🔥', '🌟', '💫', '☕']
    const idx = form.aiCreativity % openers.length
    lines.push(`${openers[idx]} Olá pessoal!`)
  } else {
    lines.push('Olá pessoal,')
  }

  // Body — adapt to tone
  let body = 'hoje trouxemos algo especial para vocês'
  if (tone === 'Profissional') body = 'apresentamos nossa novidade da semana'
  else if (tone === 'Casual') body = 'olha só o que preparamos para vocês hoje'
  else if (tone === 'Divertido') body = 'se liga nessa novidade incrível que chegou!'
  else if (tone === 'Inspirador') body = 'acorde hoje com a motivação de transformar seu dia'
  else if (tone === 'Autoridade') body = 'compartilhamos uma reflexão importante do nosso setor'
  else if (tone === 'Empático') body = 'sabemos que nem todos os dias são fáceis — estamos com você'
  else if (tone === 'Vendas') body = 'promoção imperdível por tempo limitado, confira agora'

  // Brand voice hint
  if (form.brandVoice.toLowerCase().includes('pergunta') || form.brandVoice.toLowerCase().includes('question')) {
    body += '. E você, como está começando essa semana?'
  } else if (form.brandVoice.toLowerCase().includes('emoji') && form.autoEmoji) {
    body += ' 🙌'
  }

  lines.push(body)

  // Audience nod
  if (form.targetAudience.trim()) {
    const aud = form.targetAudience.split(',')[0].trim().toLowerCase()
    if (aud) lines.push(`Feito pensando em quem é ${aud}.`)
  }

  // Hashtags
  if (form.autoHashtags && form.defaultHashtags.length > 0) {
    const tags = form.defaultHashtags
      .slice(0, Math.min(form.hashtagCount, form.defaultHashtags.length))
      .map((h) => `#${h.replace(/^#/, '')}`)
      .join(' ')
    lines.push(tags)
  } else if (form.autoHashtags) {
    // Fallback generic hashtags if user hasn't set defaults
    lines.push('#novidade #socialhub #conteudo')
  }

  return lines.join('\n')
}

// ----------------- Main Component -----------------
export function SettingsSection() {
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId)
  const setSection = useAppStore((s) => s.setSection)

  const [form, setForm] = useState<FormState>({ ...DEFAULT_FORM })
  const [savedSnapshot, setSavedSnapshot] = useState<FormState>({ ...DEFAULT_FORM })
  const [hashtagInput, setHashtagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const lastLoadedIdRef = useRef<string | null>(null)

  const settingsUrl = selectedCompanyId
    ? `/api/settings?companyId=${encodeURIComponent(selectedCompanyId)}`
    : null

  const { data, loading } = useFetch<{ settings: CompanySettings }>(settingsUrl, [
    selectedCompanyId,
  ])

  // Hydrate form from fetched settings (only when id changes or first load)
  useEffect(() => {
    if (!selectedCompanyId) {
      setForm({ ...DEFAULT_FORM })
      setSavedSnapshot({ ...DEFAULT_FORM })
      setHydrated(false)
      lastLoadedIdRef.current = null
      return
    }
    if (loading) return
    if (lastLoadedIdRef.current === selectedCompanyId && hydrated) return
    const next = formFromSettings(data?.settings)
    setForm(next)
    setSavedSnapshot(next)
    setHydrated(true)
    lastLoadedIdRef.current = selectedCompanyId
  }, [data, loading, selectedCompanyId, hydrated])

  const isDirty = useMemo(() => !formsEqual(form, savedSnapshot), [form, savedSnapshot])

  // Field updaters
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const togglePlatform = (p: string) => {
    setForm((prev) => ({
      ...prev,
      defaultPlatforms: prev.defaultPlatforms.includes(p)
        ? prev.defaultPlatforms.filter((x) => x !== p)
        : [...prev.defaultPlatforms, p],
    }))
  }

  const addHashtag = () => {
    const raw = hashtagInput.trim().replace(/^#/, '')
    if (!raw) return
    setForm((prev) => {
      if (prev.defaultHashtags.includes(raw)) return prev
      return { ...prev, defaultHashtags: [...prev.defaultHashtags, raw] }
    })
    setHashtagInput('')
  }

  const removeHashtag = (h: string) =>
    setForm((prev) => ({
      ...prev,
      defaultHashtags: prev.defaultHashtags.filter((x) => x !== h),
    }))

  const handleSave = async () => {
    if (!selectedCompanyId) {
      toast.error('Selecione uma empresa primeiro')
      return
    }
    setSaving(true)
    try {
      const res = await apiPost<{ settings: CompanySettings }>(
        '/api/settings',
        {
          companyId: selectedCompanyId,
          ...serializeForm(form),
        }
      )
      const next = formFromSettings(res.settings)
      setForm(next)
      setSavedSnapshot(next)
      toast.success('Configurações salvas com sucesso!')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  // ---------- No company selected ----------
  if (!selectedCompanyId) {
    return (
      <div className="space-y-6">
        <SectionHeader
          icon={SettingsIcon}
          title="Configurações"
          description="Defina a voz da marca e os padrões de IA para cada empresa"
        />
        <Card className="p-6">
          <EmptyState
            icon={Building2}
            title="Nenhuma empresa selecionada"
            description="Selecione uma empresa no topo da página para configurar a voz da marca, padrões de postagem e ajustes de IA."
            action={
              <Button className="gap-2" onClick={() => setSection('companies')}>
                <Building2 className="w-4 h-4" />
                Ver empresas
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={SettingsIcon}
        title="Configurações"
        description="Defina a voz da marca e os padrões de IA para cada empresa"
        action={
          <div className="flex items-center gap-2">
            {isDirty ? (
              <Badge
                variant="outline"
                className="gap-1.5 border-amber-300 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40"
              >
                <CircleAlert className="w-3 h-3" />
                Não salvo
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="gap-1.5 border-emerald-300 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
              >
                <CheckCircle2 className="w-3 h-3" />
                Salvo
              </Badge>
            )}
          </div>
        }
      />

      {/* Loading state */}
      {loading && !hydrated ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-5 w-40 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-2/3" />
                </div>
              </Card>
            ))}
          </div>
          <div className="space-y-6">
            <Card className="p-6">
              <Skeleton className="h-5 w-32 mb-4" />
              <Skeleton className="h-40 w-full" />
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Brand Voice card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Mic2 className="w-4 h-4" />
                  </span>
                  Voz da Marca
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="brandVoice" className="text-sm">
                    Personalidade da marca
                  </Label>
                  <Textarea
                    id="brandVoice"
                    value={form.brandVoice}
                    onChange={(e) => update('brandVoice', e.target.value)}
                    rows={3}
                    placeholder="Ex.: Amigável, descontraído, usa emojis moderadamente, sempre termina com pergunta"
                    className="mt-1.5 resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Descreva em linguagem natural como a marca fala com a audiência.
                  </p>
                </div>
                <div>
                  <Label htmlFor="targetAudience" className="text-sm">
                    Público-alvo
                  </Label>
                  <Input
                    id="targetAudience"
                    value={form.targetAudience}
                    onChange={(e) => update('targetAudience', e.target.value)}
                    placeholder="Ex.: Jovens 18-30, interessados em café especial"
                    className="mt-1.5"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Posting Defaults card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <CalendarClock className="w-4 h-4" />
                  </span>
                  Padrões de Postagem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="defaultTone" className="text-sm">
                      Tom padrão
                    </Label>
                    <Select
                      value={form.defaultTone}
                      onValueChange={(v) => update('defaultTone', v)}
                    >
                      <SelectTrigger id="defaultTone" className="mt-1.5 w-full">
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
                    <Label htmlFor="postingFrequency" className="text-sm">
                      Frequência de postagem
                    </Label>
                    <Select
                      value={form.postingFrequency}
                      onValueChange={(v) => update('postingFrequency', v)}
                    >
                      <SelectTrigger id="postingFrequency" className="mt-1.5 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diária</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="biweekly">Quinzenal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Plataformas padrão</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
                    {PLATFORMS.map((p) => {
                      const checked = form.defaultPlatforms.includes(p)
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
                  <Label htmlFor="hashtagInput" className="text-sm">
                    Hashtags padrão
                  </Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      id="hashtagInput"
                      value={hashtagInput}
                      onChange={(e) => setHashtagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addHashtag()
                        }
                      }}
                      placeholder="cafe, especial, novidade"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addHashtag}
                      disabled={!hashtagInput.trim()}
                      className="gap-1.5 shrink-0"
                    >
                      <Hash className="w-4 h-4" />
                      Adicionar
                    </Button>
                  </div>
                  {form.defaultHashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {form.defaultHashtags.map((h, i) => (
                        <Badge
                          key={`${h}-${i}`}
                          variant="secondary"
                          className="gap-1 pr-1.5 pl-2"
                        >
                          #{h}
                          <button
                            type="button"
                            onClick={() => removeHashtag(h)}
                            className="hover:text-rose-500 transition-colors"
                            aria-label={`Remover ${h}`}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Pressione Enter ou clique em Adicionar. Separe por vírgula para
                    várias de uma vez.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bestPostingTime" className="text-sm">
                      Melhor horário
                    </Label>
                    <Input
                      id="bestPostingTime"
                      type="time"
                      value={form.bestPostingTime}
                      onChange={(e) => update('bestPostingTime', e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="timezone" className="text-sm">
                      Fuso horário
                    </Label>
                    <Input
                      id="timezone"
                      value={form.timezone}
                      onChange={(e) => update('timezone', e.target.value)}
                      placeholder="America/Sao_Paulo"
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Configuration card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </span>
                  Configuração de IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm">Criatividade da IA</Label>
                    <Badge variant="secondary" className="tabular-nums">
                      {form.aiCreativity}
                    </Badge>
                  </div>
                  <Slider
                    value={[form.aiCreativity]}
                    onValueChange={(v) => update('aiCreativity', v[0] ?? 0)}
                    min={0}
                    max={100}
                    step={1}
                  />
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Conservador
                    </span>
                    <span className="flex items-center gap-1">
                      Criativo
                      <Wand2 className="w-3 h-3" />
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Menor = textos mais previsíveis e seguros. Maior = textos mais
                    ousados e variados.
                  </p>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="hashtagCount" className="text-sm">
                    Quantidade de hashtags
                  </Label>
                  <div className="flex items-center gap-3 mt-1.5">
                    <Input
                      id="hashtagCount"
                      type="number"
                      min={1}
                      max={15}
                      value={form.hashtagCount}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10)
                        if (isNaN(v)) return update('hashtagCount', 1)
                        update('hashtagCount', Math.min(15, Math.max(1, v)))
                      }}
                      className="w-24"
                    />
                    <span className="text-xs text-muted-foreground">
                      Entre 1 e 15 hashtags por post
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <SwitchRow
                    label="Inserir emojis automaticamente"
                    description="Adiciona emojis relevantes ao conteúdo gerado"
                    checked={form.autoEmoji}
                    onCheckedChange={(v) => update('autoEmoji', v)}
                    icon="✨"
                  />
                  <SwitchRow
                    label="Sugerir hashtags automaticamente"
                    description="Gera hashtags relevantes com base no conteúdo"
                    checked={form.autoHashtags}
                    onCheckedChange={(v) => update('autoHashtags', v)}
                    icon="#"
                  />
                  <SwitchRow
                    label="Aplicar marca d'água"
                    description="Adiciona a logo da marca em imagens geradas"
                    checked={form.watermark}
                    onCheckedChange={(v) => update('watermark', v)}
                    icon="©"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save button (mobile-friendly) */}
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setForm({ ...savedSnapshot })
                }}
                disabled={!isDirty || saving}
              >
                Descartar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="gap-2 min-w-[180px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar configurações
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* RIGHT: live preview (sticky) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-4 space-y-4">
              <Card className="overflow-hidden">
                <CardHeader className="pb-3 bg-gradient-to-br from-primary/5 to-fuchsia-500/5">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Eye className="w-4 h-4" />
                    </span>
                    Pré-visualização ao vivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <motion.div
                    key={`${form.defaultTone}-${form.aiCreativity}-${form.autoEmoji}-${form.autoHashtags}-${form.defaultHashtags.length}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-xl border border-border bg-background p-4 space-y-3"
                  >
                    {/* Mock post header */}
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
                        S
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-tight">
                          Sua Empresa
                        </p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Globe2 className="w-3 h-3" />
                          {form.defaultPlatforms.length > 0
                            ? form.defaultPlatforms
                                .slice(0, 2)
                                .map((p) => PLATFORM_META[p as Platform]?.label || p)
                                .join(' · ')
                            : 'Plataforma'}
                        </p>
                      </div>
                      <div className="ml-auto flex items-center gap-1">
                        {form.defaultPlatforms.length > 0 ? (
                          form.defaultPlatforms.slice(0, 3).map((p) => (
                            <PlatformBadge key={p} platform={p} />
                          ))
                        ) : (
                          <PlatformBadge platform="instagram" />
                        )}
                      </div>
                    </div>

                    {/* Caption preview */}
                    <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-foreground">
                      {buildPreviewCaption(form)}
                    </pre>

                    {/* Mock media placeholder */}
                    {form.watermark ? (
                      <div className="relative rounded-lg overflow-hidden aspect-video bg-gradient-to-br from-primary/20 via-fuchsia-500/15 to-primary/10 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-primary/40" />
                        <span className="absolute bottom-2 right-2 text-[10px] font-semibold bg-black/50 text-white px-2 py-0.5 rounded">
                          © Sua Empresa
                        </span>
                      </div>
                    ) : (
                      <div className="rounded-lg aspect-video bg-gradient-to-br from-primary/15 via-fuchsia-500/10 to-primary/5 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-primary/30" />
                      </div>
                    )}

                    {/* Mock actions row */}
                    <div className="flex items-center justify-around pt-2 text-muted-foreground text-xs">
                      <span className="flex items-center gap-1">
                        ❤️ Curtir
                      </span>
                      <span className="flex items-center gap-1">
                        💬 Comentar
                      </span>
                      <span className="flex items-center gap-1">
                        ↗ Compartilhar
                      </span>
                    </div>
                  </motion.div>

                  <Separator className="my-4" />

                  {/* Summary chips */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Resumo da configuração
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Mic2 className="w-3 h-3" />
                        {TONE_LABELS[form.defaultTone] || form.defaultTone}
                      </Badge>
                      <Badge variant="outline" className="gap-1 text-xs">
                        <CalendarClock className="w-3 h-3" />
                        {FREQUENCY_LABELS[form.postingFrequency] || form.postingFrequency}
                      </Badge>
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Clock className="w-3 h-3" />
                        {form.bestPostingTime || '—'}
                      </Badge>
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Bot className="w-3 h-3" />
                        Criatividade {form.aiCreativity}
                      </Badge>
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Hash className="w-3 h-3" />
                        {form.hashtagCount} hashtags
                      </Badge>
                      {form.autoEmoji && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Palette className="w-3 h-3" />
                          Emojis
                        </Badge>
                      )}
                      {form.watermark && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          © Marca d'água
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-4 bg-muted/30 border-dashed">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <Sparkles className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5 text-primary" />
                  Esta é uma prévia estática que reage às suas configurações em
                  tempo real. Os posts reais serão gerados pela IA usando essas
                  definições como base.
                </p>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ----------------- Switch Row helper -----------------
function SwitchRow({
  label,
  description,
  checked,
  onCheckedChange,
  icon,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  icon: string
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 hover:bg-accent/30 transition-colors">
      <div className="flex items-start gap-3 min-w-0">
        <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 text-sm font-bold">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-tight">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
