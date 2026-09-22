'use client'

import { useMemo, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { useFetch, apiPost, apiDelete } from '@/lib/hooks'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { SectionHeader, EmptyState, StatCard, PlatformBadge } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Hash,
  Sparkles,
  Plus,
  Copy,
  Check,
  Trash2,
  Loader2,
  Wand2,
  ArrowRight,
  Layers,
  Building2,
  Filter,
  Tags,
} from 'lucide-react'

interface HashtagGroup {
  id: string
  companyId: string | null
  name: string
  niche: string | null
  platform: string | null
  tags: string // JSON string array
  description: string | null
  color: string | null
  usageCount: number
  createdAt: string
}

const PLATFORM_OPTIONS = [
  { value: 'none', label: 'Todas / Genérico' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
]

const COLOR_PRESETS = [
  '#7C3AED', // violet
  '#A855F7', // purple
  '#EC4899', // pink
  '#F43F5E', // rose
  '#10B981', // emerald
  '#F59E0B', // amber
]

const DEFAULT_COLOR = '#7C3AED'

/** Parse a JSON string of tags safely. Returns [] on failure. */
function safeParseTags(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((t) => typeof t === 'string' && t.trim().length > 0)
  } catch {
    return []
  }
}

/** Split a comma-separated input into clean tag strings (no leading #). */
function parseTagInput(input: string): string[] {
  return input
    .split(/[,\n]/)
    .map((t) => t.trim().replace(/^#+/, '').trim())
    .filter((t) => t.length > 0)
}

export function HashtagsSection() {
  const companyId = useAppStore((s) => s.selectedCompanyId)
  const setSection = useAppStore((s) => s.setSection)
  const setSelectedCompany = useAppStore((s) => s.setSelectedCompany)
  const setCreatorPrefill = useAppStore((s) => s.setCreatorPrefill)

  const [genOpen, setGenOpen] = useState(false)
  const [genNiche, setGenNiche] = useState('')
  const [genPlatform, setGenPlatform] = useState('none')
  const [generating, setGenerating] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: '',
    niche: '',
    platform: 'none',
    description: '',
    tagsInput: '',
    color: COLOR_PRESETS[0],
  })

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch all groups; we filter client-side so global (companyId === null) groups
  // remain visible alongside the selected company's groups.
  const { data: groupsData, loading, refresh } = useFetch<{ groups: HashtagGroup[] }>(
    '/api/hashtags',
    []
  )
  const { data: compData } = useFetch<{ companies: any[] }>('/api/companies', [])

  const groups = groupsData?.groups || []
  const companies = compData?.companies || []
  const activeCompany = companies.find((c) => c.id === companyId) || null

  // Visible groups: when a company is selected, show that company's groups + global
  // groups (companyId === null). When no company is selected, show everything.
  const visibleGroups = useMemo(() => {
    if (!companyId) return groups
    return groups.filter(
      (g) => g.companyId === companyId || g.companyId === null
    )
  }, [groups, companyId])

  // KPIs
  const totalTags = useMemo(
    () =>
      visibleGroups.reduce(
        (sum, g) => sum + safeParseTags(g.tags).length,
        0
      ),
    [visibleGroups]
  )

  const groupsForCurrentCompany = useMemo(
    () => (companyId ? groups.filter((g) => g.companyId === companyId) : []),
    [groups, companyId]
  )

  const distinctCompaniesWithGroups = useMemo(() => {
    const ids = new Set<string>()
    groups.forEach((g) => {
      if (g.companyId) ids.add(g.companyId)
    })
    return ids.size
  }, [groups])

  async function handleGenerate() {
    if (!companyId) {
      toast.error('Selecione uma empresa no topo da tela primeiro')
      return
    }
    const niche = genNiche.trim() || activeCompany?.niche || ''
    if (!niche) {
      toast.error('Informe o nicho da empresa')
      return
    }
    setGenerating(true)
    try {
      const res = await apiPost<{ count: number }>('/api/hashtags/generate', {
        company: activeCompany?.name || 'Empresa',
        niche,
        platform: genPlatform === 'none' ? undefined : genPlatform,
        companyId,
        save: true,
      })
      toast.success(`${res.count} grupos de hashtags gerados!`)
      setGenOpen(false)
      setGenNiche('')
      setGenPlatform('none')
      refresh()
    } catch (e: any) {
      toast.error(e.message || 'Falha ao gerar hashtags')
    } finally {
      setGenerating(false)
    }
  }

  async function handleCreateManual() {
    const tags = parseTagInput(form.tagsInput)
    if (!form.name.trim()) {
      toast.error('Informe o nome do grupo')
      return
    }
    if (tags.length === 0) {
      toast.error('Adicione ao menos uma hashtag')
      return
    }
    setCreating(true)
    try {
      await apiPost('/api/hashtags', {
        companyId: companyId || null,
        name: form.name.trim(),
        niche: form.niche.trim() || activeCompany?.niche || null,
        platform: form.platform === 'none' ? null : form.platform,
        tags,
        description: form.description.trim() || null,
        color: form.color,
      })
      toast.success('Grupo criado com sucesso!')
      setCreateOpen(false)
      setForm({
        name: '',
        niche: '',
        platform: 'none',
        description: '',
        tagsInput: '',
        color: COLOR_PRESETS[0],
      })
      refresh()
    } catch (e: any) {
      toast.error(e.message || 'Falha ao criar grupo')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await apiDelete(`/api/hashtags?id=${deleteId}`)
      toast.success('Grupo excluído')
      refresh()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao excluir')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  function openGenerate() {
    setGenNiche(activeCompany?.niche || '')
    setGenPlatform('none')
    setGenOpen(true)
  }

  function openCreate() {
    setForm((f) => ({
      ...f,
      name: '',
      niche: activeCompany?.niche || '',
      platform: 'none',
      description: '',
      tagsInput: '',
      color: COLOR_PRESETS[0],
    }))
    setCreateOpen(true)
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Banco de Hashtags"
        description="Grupos de hashtags por nicho, gerados com IA ou criados manualmente."
        icon={Hash}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={openCreate}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo grupo</span>
            </Button>
            <Button
              className="gap-2 bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90"
              onClick={openGenerate}
            >
              <Sparkles className="w-4 h-4" />
              Gerar com IA
            </Button>
          </div>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total de grupos"
          value={visibleGroups.length}
          icon={Layers}
          accent="#7C3AED"
          hint={
            companyId
              ? `${groupsForCurrentCompany.length} da empresa + ${
                  visibleGroups.length - groupsForCurrentCompany.length
                } globais`
              : 'Todos os grupos visíveis'
          }
          delay={0}
        />
        <StatCard
          label="Total de hashtags"
          value={totalTags}
          icon={Tags}
          accent="#EC4899"
          hint="Soma de todas as tags nos grupos"
          delay={0.05}
        />
        <StatCard
          label={
            companyId && activeCompany
              ? `Grupos de ${activeCompany.name}`
              : 'Grupos por empresa'
          }
          value={
            companyId
              ? groupsForCurrentCompany.length
              : distinctCompaniesWithGroups
          }
          icon={Building2}
          accent="#A855F7"
          hint={
            companyId
              ? 'Empresa selecionada no topo'
              : 'Empresas com hashtags cadastradas'
          }
          delay={0.1}
        />
      </div>

      {/* Company context banner */}
      {companyId && (
        <Card className="p-4 border-primary/30 bg-primary/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Filter className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  Filtrando por {activeCompany?.name || 'empresa selecionada'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Mostrando grupos da empresa + grupos globais
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => setSelectedCompany(null)}
            >
              Ver todas as empresas
            </Button>
          </div>
        </Card>
      )}

      {/* Group grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-1.5 w-full bg-muted" />
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <Skeleton key={j} className="h-6 w-16 rounded-full" />
                  ))}
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : visibleGroups.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Hash}
              title="Nenhum grupo de hashtags ainda"
              description="Gere grupos com IA baseados no nicho da sua empresa, ou crie grupos manuais para organizar suas hashtags favoritas por tema."
              action={
                <Button
                  className="gap-2 bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90"
                  onClick={openGenerate}
                >
                  <Sparkles className="w-4 h-4" />
                  Gerar com IA
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {visibleGroups.map((group, i) => (
              <HashtagCard
                key={group.id}
                group={group}
                index={i}
                onDelete={(id) => setDeleteId(id)}
                onUseInCreator={(tags) => {
                  setCreatorPrefill({
                    topic: '',
                    keywords: tags.join(', '),
                    source: 'hashtags',
                  })
                  setSection('creator')
                  toast.success('Hashtags enviadas para o Criador')
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* AI Generation dialog */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center">
                <Wand2 className="w-4 h-4 text-white" />
              </div>
              Gerar hashtags com IA
            </DialogTitle>
            <DialogDescription>
              A IA criará 6 grupos de hashtags (branded, nicho, trending, local,
              educacional e engajamento) com 6-10 tags cada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!companyId && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 text-xs text-amber-700 dark:text-amber-300">
                Selecione uma empresa no topo da tela para associar os grupos
                gerados.
              </div>
            )}
            {activeCompany ? (
              <div className="rounded-lg bg-muted/50 p-3 text-xs">
                <p className="text-muted-foreground">Empresa ativa</p>
                <p className="font-semibold flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5" />
                  {activeCompany.name}
                </p>
                {activeCompany.niche && (
                  <p className="text-muted-foreground mt-0.5">
                    Nicho: {activeCompany.niche}
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                Nenhuma empresa selecionada — selecione uma no topo da tela.
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Nicho (editável)</Label>
              <Input
                value={genNiche}
                onChange={(e) => setGenNiche(e.target.value)}
                placeholder={
                  activeCompany?.niche || 'Ex: Gastronomia / Cafeteria'
                }
              />
              <p className="text-[11px] text-muted-foreground">
                Pré-preenchido com o nicho da empresa. Edite se quiser refinar.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Plataforma foco (opcional)</Label>
              <Select value={genPlatform} onValueChange={setGenPlatform}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  Gerar 6 grupos
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto scroll-fancy">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              Novo grupo de hashtags
            </DialogTitle>
            <DialogDescription>
              Crie um grupo manual com suas hashtags favoritas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {activeCompany && (
              <div className="rounded-lg bg-muted/50 p-2.5 text-xs flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">
                  Empresa: <span className="font-semibold text-foreground">{activeCompany.name}</span>
                </span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Nome do grupo *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Hashtags da Marca"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nicho</Label>
                <Input
                  value={form.niche}
                  onChange={(e) => setForm({ ...form, niche: e.target.value })}
                  placeholder={activeCompany?.niche || 'Ex: Cafeteria'}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Plataforma</Label>
                <Select
                  value={form.platform}
                  onValueChange={(v) => setForm({ ...form, platform: v })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORM_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Descrição</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Quando usar este grupo..."
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                Hashtags (separadas por vírgula) *
              </Label>
              <Textarea
                value={form.tagsInput}
                onChange={(e) =>
                  setForm({ ...form, tagsInput: e.target.value })
                }
                placeholder="cafe, café especial, barista, morning coffee"
                rows={3}
              />
              {parseTagInput(form.tagsInput).length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 max-h-24 overflow-y-auto scroll-fancy">
                  {parseTagInput(form.tagsInput).map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary"
                    >
                      <Hash className="w-2.5 h-2.5" />
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cor do grupo</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={cn(
                      'w-8 h-8 rounded-lg transition-all border-2',
                      form.color === c
                        ? 'border-foreground scale-110'
                        : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Selecionar cor ${c}`}
                  >
                    {form.color === c && (
                      <Check className="w-4 h-4 text-white mx-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="gap-2"
              onClick={handleCreateManual}
              disabled={creating}
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Criar grupo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              O grupo de hashtags será removido permanentemente. Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 hover:bg-rose-600 text-white"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ---------- HashtagCard ---------- */

function HashtagCard({
  group,
  index,
  onDelete,
  onUseInCreator,
}: {
  group: HashtagGroup
  index: number
  onDelete: (id: string) => void
  onUseInCreator: (tags: string[]) => void
}) {
  const tags = safeParseTags(group.tags)
  const color = group.color || DEFAULT_COLOR
  const [copiedTag, setCopiedTag] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [copying, setCopying] = useState(false)

  async function copySingleTag(tag: string) {
    try {
      await navigator.clipboard.writeText(`#${tag}`)
      setCopiedTag(tag)
      toast.success(`#${tag} copiada`)
      setTimeout(() => setCopiedTag(null), 1500)
    } catch {
      toast.error('Não foi possível copiar')
    }
  }

  async function copyAll() {
    if (tags.length === 0) return
    setCopying(true)
    try {
      const text = tags.map((t) => `#${t}`).join(' ')
      await navigator.clipboard.writeText(text)
      setCopiedAll(true)
      toast.success(`${tags.length} hashtags copiadas`)
      setTimeout(() => setCopiedAll(false), 1500)
    } catch {
      toast.error('Não foi possível copiar')
    } finally {
      setCopying(false)
    }
  }

  function useInCreator() {
    onUseInCreator(tags)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Card className="overflow-hidden group hover:shadow-md transition-shadow h-full flex flex-col">
        {/* Color-coded top stripe */}
        <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

        <CardContent className="p-5 flex flex-col flex-1 gap-3">
          {/* Header: name + badges + delete */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm leading-tight truncate">
                {group.name}
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                {group.niche && (
                  <span
                    className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: `${color}20`,
                      color,
                    }}
                  >
                    {group.niche}
                  </span>
                )}
                {group.platform && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    <PlatformBadge platform={group.platform} />
                    {group.platform}
                  </span>
                )}
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="w-7 h-7 opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-opacity shrink-0"
              onClick={() => onDelete(group.id)}
              aria-label="Excluir grupo"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Description */}
          {group.description && (
            <p className="text-xs text-muted-foreground italic line-clamp-2">
              {group.description}
            </p>
          )}

          {/* Hashtag chips */}
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scroll-fancy -mr-1 pr-1">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => copySingleTag(tag)}
                  className="inline-flex items-center gap-0.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  title={`Copiar #${tag}`}
                >
                  <Hash className="w-2.5 h-2.5" />
                  {tag}
                  {copiedTag === tag ? (
                    <Check className="w-2.5 h-2.5 ml-0.5" />
                  ) : (
                    <Copy className="w-2.5 h-2.5 ml-0.5 opacity-50" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Sem hashtags neste grupo.
            </p>
          )}

          <Separator />

          {/* Footer: usage + actions */}
          <div className="flex items-center justify-between gap-2 mt-auto">
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Badge variant="secondary" className="text-[10px] h-5">
                usado {group.usageCount} {group.usageCount === 1 ? 'vez' : 'vezes'}
              </Badge>
              <span className="text-muted-foreground/70">
                · {tags.length} tags
              </span>
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5 flex-1"
              onClick={copyAll}
              disabled={copying || tags.length === 0}
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar todas
                </>
              )}
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5 flex-1 bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90"
              onClick={useInCreator}
              disabled={tags.length === 0}
            >
              <ArrowRight className="w-3.5 h-3.5" />
              Usar no Criador
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
