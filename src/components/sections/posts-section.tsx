'use client'

import { useMemo, useState } from 'react'
import { useFetch, apiPut, apiDelete } from '@/lib/hooks'
import { useAppStore } from '@/lib/store'
import { cn, formatDateTime, toLocalInputValue } from '@/lib/utils'
import { PlatformIcon } from '@/lib/platform-icons'
import {
  PLATFORMS,
  PLATFORM_META,
  POST_CATEGORIES,
  TONES,
  type Platform,
} from '@/lib/types'
import {
  StatCard,
  SectionHeader,
  EmptyState,
  PlatformBadge,
  StatusBadge,
} from '@/components/shared/ui'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays,
  List as ListIcon,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  CheckCircle2,
  Pencil,
  Trash2,
  Sparkles,
  Hash,
} from 'lucide-react'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function safeParse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback
  try {
    return JSON.parse(s) as T
  } catch {
    return fallback
  }
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function PostsSection() {
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId)
  const setSection = useAppStore((s) => s.setSection)

  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [companyOverride, setCompanyOverride] = useState<string | null>(null)
  const companyFilter = companyOverride ?? selectedCompanyId ?? 'all'
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [editing, setEditing] = useState<any | null>(null)

  const postsUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (companyFilter !== 'all') params.set('companyId', companyFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    return `/api/posts?${params.toString()}`
  }, [companyFilter, statusFilter])

  const { data, loading, refresh } = useFetch<{ posts: any[] }>(postsUrl, [
    companyFilter,
    statusFilter,
  ])
  const { data: companiesData } = useFetch<{ companies: any[] }>('/api/companies', [])

  const posts = data?.posts || []
  const companies = companiesData?.companies || []

  const filteredPosts = useMemo(() => {
    if (!search.trim()) return posts
    const q = search.toLowerCase()
    return posts.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.content?.toLowerCase().includes(q)
    )
  }, [posts, search])

  const counts = useMemo(() => {
    const c = { draft: 0, scheduled: 0, published: 0 }
    for (const p of posts) {
      if (p.status === 'draft') c.draft++
      else if (p.status === 'scheduled') c.scheduled++
      else if (p.status === 'published') c.published++
    }
    return c
  }, [posts])

  const postsByDay = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const p of posts) {
      if (!p.scheduledAt) continue
      const d = new Date(p.scheduledAt)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!map[key]) map[key] = []
      map[key].push(p)
    }
    return map
  }, [posts])

  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const startWeekday = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: { date: Date | null; key: string }[] = []
    for (let i = 0; i < startWeekday; i++)
      cells.push({ date: null, key: `blank-${i}` })
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d)
      cells.push({ date, key: `${year}-${month}-${d}` })
    }
    return cells
  }, [calendarMonth])

  const today = new Date()
  const selectedDayPosts = useMemo(() => {
    if (!selectedDay) return []
    const key = `${selectedDay.getFullYear()}-${selectedDay.getMonth()}-${selectedDay.getDate()}`
    return postsByDay[key] || []
  }, [selectedDay, postsByDay])

  const prevMonth = () =>
    setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  const nextMonth = () =>
    setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
  const goToday = () => {
    const d = new Date()
    setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1))
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={CalendarDays}
        title="Posts & Agenda"
        description="Gerencie posts agendados e publicados em todas as redes sociais"
        action={
          <Button className="gap-2" onClick={() => setSection('creator')}>
            <Plus className="w-4 h-4" />
            Novo Post
          </Button>
        }
      />

      {/* Stat summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Rascunhos"
          value={counts.draft}
          icon={FileText}
          accent="#6B7280"
          delay={0}
        />
        <StatCard
          label="Agendados"
          value={counts.scheduled}
          icon={Clock}
          accent="#F59E0B"
          delay={0.05}
        />
        <StatCard
          label="Publicados"
          value={counts.published}
          icon={CheckCircle2}
          accent="#10B981"
          delay={0.1}
        />
      </div>

      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por título ou conteúdo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="scheduled">Agendado</SelectItem>
              <SelectItem value="published">Publicado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={companyFilter} onValueChange={setCompanyOverride}>
            <SelectTrigger className="w-full md:w-52">
              <SelectValue placeholder="Empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as empresas</SelectItem>
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
        </div>
      </Card>

      <Tabs value={view} onValueChange={(v) => setView(v as 'calendar' | 'list')}>
        <TabsList>
          <TabsTrigger value="calendar" className="gap-1.5">
            <CalendarDays className="w-4 h-4" /> Calendário
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-1.5">
            <ListIcon className="w-4 h-4" /> Lista
          </TabsTrigger>
        </TabsList>

        {/* Calendar view */}
        <TabsContent value="calendar" className="mt-4">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">
                {MONTHS[calendarMonth.getMonth()]}{' '}
                {calendarMonth.getFullYear()}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevMonth}
                  aria-label="Mês anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToday}>
                  Hoje
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextMonth}
                  aria-label="Próximo mês"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-[11px] sm:text-xs font-semibold text-muted-foreground py-2"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((cell) => {
                if (!cell.date) {
                  return <div key={cell.key} className="aspect-square" />
                }
                const key = `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}`
                const dayPosts = postsByDay[key] || []
                const isToday = isSameDay(cell.date, today)
                return (
                  <button
                    key={cell.key}
                    onClick={() => dayPosts.length > 0 && setSelectedDay(cell.date)}
                    className={cn(
                      'aspect-square rounded-lg border border-border p-1 sm:p-1.5 flex flex-col items-start gap-0.5 transition-colors text-left',
                      dayPosts.length > 0
                        ? 'cursor-pointer hover:border-primary/40 hover:bg-accent/40'
                        : 'cursor-default'
                    )}
                  >
                    <span
                      className={cn(
                        'text-[11px] sm:text-xs font-medium',
                        isToday ? 'text-primary' : 'text-foreground'
                      )}
                    >
                      {cell.date.getDate()}
                    </span>
                    {dayPosts.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-auto">
                        {dayPosts.slice(0, 4).map((p) => (
                          <span
                            key={p.id}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor:
                                p.company?.brandColor || '#7C3AED',
                            }}
                          />
                        ))}
                        {dayPosts.length > 4 && (
                          <span className="text-[9px] text-muted-foreground leading-none">
                            +{dayPosts.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                    {isToday && (
                      <span className="sr-only">Hoje</span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>Clique em um dia para ver os posts agendados</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-3 h-3" />
                <span>{posts.length} posts no total</span>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* List view */}
        <TabsContent value="list" className="mt-4">
          <Card className="overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Nenhum post encontrado"
                description="Ajuste os filtros ou crie um novo post com a ajuda da IA."
                action={
                  <Button className="gap-2" onClick={() => setSection('creator')}>
                    <Sparkles className="w-4 h-4" /> Criar com IA
                  </Button>
                }
              />
            ) : (
              <div className="max-h-[640px] overflow-y-auto scroll-fancy divide-y">
                <AnimatePresence initial={false}>
                  {filteredPosts.map((post, i) => {
                    const hashtags = safeParse<string[]>(post.hashtags, [])
                    const platforms = (post.targets || []).map(
                      (t: any) => t.platform
                    )
                    const category = POST_CATEGORIES.find(
                      (c) => c.value === post.category
                    )
                    return (
                      <motion.button
                        key={post.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ delay: Math.min(i * 0.02, 0.2) }}
                        onClick={() => setEditing(post)}
                        className="group w-full flex items-start gap-3 p-4 hover:bg-accent/40 transition-colors text-left"
                      >
                        <span
                          className="w-1 self-stretch rounded-full shrink-0 min-h-[48px]"
                          style={{
                            backgroundColor: post.company?.brandColor || '#7C3AED',
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-sm truncate">
                              {post.title}
                            </span>
                            <StatusBadge status={post.status} />
                            {category && (
                              <Badge variant="secondary" className="text-[10px]">
                                {category.label}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">
                            {post.content}
                          </p>
                          <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    post.company?.brandColor || '#7C3AED',
                                }}
                              />
                              {post.company?.name || '—'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDateTime(post.scheduledAt)}
                            </span>
                            <div className="flex items-center gap-1">
                              {platforms.map((p: string) => (
                                <PlatformBadge key={p} platform={p} />
                              ))}
                            </div>
                            {hashtags.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                {hashtags.length}
                              </span>
                            )}
                          </div>
                        </div>
                        <Pencil className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                      </motion.button>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Day detail dialog */}
      <Dialog open={!!selectedDay} onOpenChange={(o) => !o && setSelectedDay(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              {selectedDay?.toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
              })}
            </DialogTitle>
            <DialogDescription>
              {selectedDayPosts.length}{' '}
              {selectedDayPosts.length === 1
                ? 'post agendado'
                : 'posts agendados'}{' '}
              neste dia
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto scroll-fancy -mx-1 px-1">
            <div className="space-y-2">
              {selectedDayPosts.map((p) => {
                const platforms = (p.targets || []).map((t: any) => t.platform)
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setEditing(p)
                      setSelectedDay(null)
                    }}
                    className="w-full flex items-start gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/40 transition-colors text-left"
                  >
                    <span
                      className="w-1 self-stretch rounded-full shrink-0"
                      style={{
                        backgroundColor: p.company?.brandColor || '#7C3AED',
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm truncate">
                          {p.title}
                        </span>
                        <StatusBadge status={p.status} />
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">
                        {p.content}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(p.scheduledAt)}
                        </span>
                        <div className="flex items-center gap-1">
                          {platforms.map((pl: string) => (
                            <PlatformBadge key={pl} platform={pl} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      {editing && (
        <EditPostDialog
          post={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            refresh()
            setEditing(null)
          }}
          onDeleted={() => {
            refresh()
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function EditPostDialog({
  post,
  onClose,
  onSaved,
  onDeleted,
}: {
  post: any
  onClose: () => void
  onSaved: () => void
  onDeleted: () => void
}) {
  const [title, setTitle] = useState(post.title || '')
  const [content, setContent] = useState(post.content || '')
  const [scheduledAt, setScheduledAt] = useState(
    toLocalInputValue(post.scheduledAt)
  )
  const [status, setStatus] = useState(post.status || 'draft')
  const [category, setCategory] = useState(post.category || 'promocional')
  const [tone, setTone] = useState(post.tone || 'profissional')
  const [platforms, setPlatforms] = useState<string[]>(
    (post.targets || []).map((t: any) => t.platform)
  )
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const hashtags = safeParse<string[]>(post.hashtags, [])

  const togglePlatform = (p: string) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Título é obrigatório')
      return
    }
    setSaving(true)
    try {
      await apiPut(`/api/posts/${post.id}`, {
        title,
        content,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        status,
        category,
        tone,
        platforms,
        hashtags,
        variations: {},
      })
      toast.success('Post atualizado com sucesso!')
      onSaved()
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar post')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await apiDelete(`/api/posts/${post.id}`)
      toast.success('Post excluído')
      onDeleted()
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao excluir')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" /> Editar Post
          </DialogTitle>
          <DialogDescription>
            Altere os campos abaixo e salve as alterações.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Conteúdo</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="mt-1.5 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {content.length} caracteres
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1.5 w-full">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1.5 w-full">
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
            <div>
              <Label>Tom de voz</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t}
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
          {hashtags.length > 0 && (
            <div>
              <Label>Hashtags</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {hashtags.map((h, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    #{h}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Excluindo...' : 'Excluir'}
          </Button>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
