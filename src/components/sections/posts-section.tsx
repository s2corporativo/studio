'use client'

import { useMemo, useState } from 'react'
import { useFetch, apiPost, apiPut, apiDelete } from '@/lib/hooks'
import { useAppStore } from '@/lib/store'
import { cn, formatDateTime, toLocalInputValue } from '@/lib/utils'
import { PlatformIcon } from '@/lib/platform-icons'
import {
  PLATFORMS,
  PLATFORM_META,
  POST_CATEGORIES,
  POST_STATUS_META,
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
import { PostDetailDrawer } from '@/components/sections/post-detail-drawer'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  MoreHorizontal,
  Copy,
  CheckSquare,
  X,
  Loader2,
  Image as ImageIcon,
  LayoutGrid,
  ArrowRight,
  Check,
  RotateCcw,
  Calendar,
  Download,
  ChevronDown,
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

  const [view, setView] = useState<'calendar' | 'list' | 'kanban'>('calendar')
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
  const [detailPost, setDetailPost] = useState<any | null>(null)
  const [transitionLoading, setTransitionLoading] = useState<{
    id: string
    status: string
  } | null>(null)

  // Bulk selection state
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [singleDeletePost, setSingleDeletePost] = useState<any | null>(null)
  const [bulkActionLoading, setBulkActionLoading] = useState<
    'duplicate' | 'delete' | null
  >(null)
  const [rowActionLoading, setRowActionLoading] = useState<{
    id: string
    action: 'duplicate' | 'delete'
  } | null>(null)

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

  // ---------- Selection handlers ----------
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (prev.size === filteredPosts.length) return new Set()
      return new Set(filteredPosts.map((p) => p.id))
    })
  }

  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  const handleSingleDuplicate = async (post: any) => {
    setRowActionLoading({ id: post.id, action: 'duplicate' })
    try {
      await apiPost(`/api/posts/${post.id}`, { action: 'duplicate' })
      toast.success('Post duplicado com sucesso!')
      refresh()
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao duplicar post')
    } finally {
      setRowActionLoading(null)
    }
  }

  const handleSingleDelete = async (post: any) => {
    setRowActionLoading({ id: post.id, action: 'delete' })
    try {
      await apiDelete(`/api/posts/${post.id}`)
      toast.success('Post excluído')
      refresh()
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao excluir post')
    } finally {
      setRowActionLoading(null)
      setSingleDeletePost(null)
    }
  }

  const handleStatusTransition = async (
    post: any,
    newStatus: string,
    scheduledAt?: string
  ) => {
    setTransitionLoading({ id: post.id, status: newStatus })
    try {
      const body: any = { status: newStatus }
      if (scheduledAt) body.scheduledAt = scheduledAt
      await apiPut(`/api/posts/${post.id}`, body)
      const labels: Record<string, string> = {
        review: 'Post enviado para revisão!',
        approved: 'Post aprovado!',
        scheduled: 'Post agendado!',
        draft: 'Post voltou para rascunho',
      }
      toast.success(labels[newStatus] || 'Status atualizado!')
      refresh()
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao atualizar status')
    } finally {
      setTransitionLoading(null)
    }
  }

  const handleBulkDuplicate = async () => {
    if (selectedIds.size === 0) return
    setBulkActionLoading('duplicate')
    let success = 0
    let failed = 0
    try {
      for (const id of selectedIds) {
        try {
          await apiPost(`/api/posts/${id}`, { action: 'duplicate' })
          success++
        } catch {
          failed++
        }
      }
      if (failed === 0) {
        toast.success(`${success} posts duplicados com sucesso!`)
      } else {
        toast.warning(`${success} duplicados, ${failed} falharam`)
      }
      exitSelectionMode()
      refresh()
    } finally {
      setBulkActionLoading(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    setBulkActionLoading('delete')
    let success = 0
    let failed = 0
    try {
      for (const id of selectedIds) {
        try {
          await apiDelete(`/api/posts/${id}`)
          success++
        } catch {
          failed++
        }
      }
      if (failed === 0) {
        toast.success(`${success} posts excluídos`)
      } else {
        toast.warning(`${success} excluídos, ${failed} falharam`)
      }
      setConfirmBulkDelete(false)
      exitSelectionMode()
      refresh()
    } finally {
      setBulkActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={CalendarDays}
        title="Posts & Agenda"
        description="Gerencie posts agendados e publicados em todas as redes sociais"
        action={
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 h-9">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Exportar</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Exportar calendário
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    const url = `/api/calendar-export?format=ical${companyId ? `&companyId=${companyId}` : ''}`
                    window.open(url, '_blank')
                    toast.success('Calendário iCal exportado')
                  }}
                  className="gap-2"
                >
                  <Calendar className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">iCal (.ics)</p>
                    <p className="text-[10px] text-muted-foreground">Importar no Google Calendar, Apple, Outlook</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const url = `/api/calendar-export?format=csv${companyId ? `&companyId=${companyId}` : ''}`
                    window.open(url, '_blank')
                    toast.success('Calendário CSV exportado')
                  }}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium">CSV (.csv)</p>
                    <p className="text-[10px] text-muted-foreground">Planilha para Excel / Google Sheets</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="gap-2" onClick={() => setSection('creator')}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Post</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
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
          {view === 'list' && !selectionMode ? (
            <Button
              variant="outline"
              onClick={() => setSelectionMode(true)}
              className="gap-2 shrink-0"
            >
              <CheckSquare className="w-4 h-4" />
              Selecionar
            </Button>
          ) : view === 'list' && selectionMode ? (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="gap-1.5"
                disabled={filteredPosts.length === 0}
              >
                <CheckSquare className="w-4 h-4" />
                {selectedIds.size === filteredPosts.length &&
                filteredPosts.length > 0
                  ? 'Desmarcar tudo'
                  : 'Marcar tudo'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exitSelectionMode}
                className="gap-1.5"
              >
                <X className="w-4 h-4" />
                Sair
              </Button>
            </div>
          ) : null}
        </div>
      </Card>

      <Tabs
        value={view}
        onValueChange={(v) => {
          const next = v as 'calendar' | 'list' | 'kanban'
          setView(next)
          if (next !== 'list' && selectionMode) exitSelectionMode()
        }}
      >
        <TabsList>
          <TabsTrigger value="calendar" className="gap-1.5">
            <CalendarDays className="w-4 h-4" /> Calendário
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-1.5">
            <ListIcon className="w-4 h-4" /> Lista
          </TabsTrigger>
          <TabsTrigger value="kanban" className="gap-1.5">
            <LayoutGrid className="w-4 h-4" /> Aprovação
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
                    const mediaUrls = safeParse<string[]>(post.mediaUrls, [])
                    const platforms = (post.targets || []).map(
                      (t: any) => t.platform
                    )
                    const category = POST_CATEGORIES.find(
                      (c) => c.value === post.category
                    )
                    const isSelected = selectedIds.has(post.id)
                    const rowLoading =
                      rowActionLoading?.id === post.id
                        ? rowActionLoading.action
                        : null
                    return (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ delay: Math.min(i * 0.02, 0.2) }}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (selectionMode) toggleSelect(post.id)
                          else setDetailPost(post)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            if (selectionMode) toggleSelect(post.id)
                            else setDetailPost(post)
                          }
                        }}
                        className={cn(
                          'group w-full flex items-start gap-3 p-4 hover:bg-accent/40 transition-colors text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                          selectionMode && isSelected && 'bg-primary/5'
                        )}
                      >
                        <span
                          className="w-1 self-stretch rounded-full shrink-0 min-h-[48px]"
                          style={{
                            backgroundColor: post.company?.brandColor || '#7C3AED',
                          }}
                        />
                        {selectionMode && (
                          <div onClick={(e) => e.stopPropagation()} className="mt-1.5 shrink-0">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelect(post.id)}
                              aria-label={`Selecionar ${post.title}`}
                            />
                          </div>
                        )}
                        {mediaUrls.length > 0 ? (
                          <div className="relative shrink-0 mt-0.5">
                            <img
                              src={mediaUrls[0]}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover border border-border"
                              loading="lazy"
                            />
                            {mediaUrls.length > 1 && (
                              <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none flex items-center justify-center">
                                +{mediaUrls.length - 1}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg border border-dashed border-border flex items-center justify-center shrink-0 mt-0.5 text-muted-foreground/50">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
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
                        {!selectionMode && (
                          <div
                            className="shrink-0 mt-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity data-[state=open]:opacity-100"
                                  aria-label="Ações do post"
                                  disabled={!!rowLoading}
                                >
                                  {rowLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="w-4 h-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                  onClick={() => setEditing(post)}
                                  className="gap-2 cursor-pointer"
                                >
                                  <Pencil className="w-4 h-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleSingleDuplicate(post)}
                                  className="gap-2 cursor-pointer"
                                  disabled={rowLoading === 'duplicate'}
                                >
                                  <Copy className="w-4 h-4" />
                                  Duplicar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setSingleDeletePost(post)}
                                  className="gap-2 cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40"
                                  disabled={rowLoading === 'delete'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Kanban (approval) view */}
        <TabsContent value="kanban" className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-6 w-2/3 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-3" />
                  <Skeleton className="h-8 w-full" />
                </Card>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <EmptyState
              icon={LayoutGrid}
              title="Nenhum post para revisar"
              description="Crie posts no Creator e gerencie o fluxo de aprovação por aqui."
              action={
                <Button className="gap-2" onClick={() => setSection('creator')}>
                  <Sparkles className="w-4 h-4" /> Criar com IA
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KanbanColumn
                title="Rascunhos"
                statusColor={POST_STATUS_META.draft.color}
                posts={filteredPosts.filter((p) => p.status === 'draft')}
                onOpen={setDetailPost}
                onTransition={handleStatusTransition}
                loadingId={transitionLoading?.id || null}
              />
              <KanbanColumn
                title="Em revisão"
                statusColor={POST_STATUS_META.review.color}
                posts={filteredPosts.filter((p) => p.status === 'review')}
                onOpen={setDetailPost}
                onTransition={handleStatusTransition}
                loadingId={transitionLoading?.id || null}
              />
              <KanbanColumn
                title="Aprovado"
                statusColor={POST_STATUS_META.approved.color}
                posts={filteredPosts.filter((p) => p.status === 'approved')}
                onOpen={setDetailPost}
                onTransition={handleStatusTransition}
                loadingId={transitionLoading?.id || null}
              />
              <KanbanColumn
                title="Agendado / Publicado"
                statusColor={POST_STATUS_META.scheduled.color}
                posts={filteredPosts.filter(
                  (p) =>
                    p.status === 'scheduled' || p.status === 'published'
                )}
                onOpen={setDetailPost}
                onTransition={handleStatusTransition}
                loadingId={transitionLoading?.id || null}
              />
            </div>
          )}
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

      {/* Single post delete confirmation */}
      <AlertDialog
        open={!!singleDeletePost}
        onOpenChange={(o) => !o && setSingleDeletePost(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-500" />
              Excluir post
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{' '}
              <strong className="text-foreground">
                {singleDeletePost?.title}
              </strong>
              ? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!rowActionLoading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => singleDeletePost && handleSingleDelete(singleDeletePost)}
              disabled={!!rowActionLoading}
              className="bg-rose-600 hover:bg-rose-700 text-white gap-2"
            >
              {rowActionLoading?.action === 'delete' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation */}
      <AlertDialog
        open={confirmBulkDelete}
        onOpenChange={(o) => !o && setConfirmBulkDelete(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-500" />
              Excluir {selectedIds.size} posts?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir{' '}
              <strong className="text-foreground">{selectedIds.size}</strong>{' '}
              {selectedIds.size === 1 ? 'post' : 'posts'} permanentemente. Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!bulkActionLoading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={!!bulkActionLoading}
              className="bg-rose-600 hover:bg-rose-700 text-white gap-2"
            >
              {bulkActionLoading === 'delete' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Excluir todos
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Floating bulk action bar */}
      <AnimatePresence>
        {selectionMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
          >
            <div className="flex items-center gap-3 bg-card border border-border shadow-xl rounded-2xl px-4 py-3 backdrop-blur-md bg-card/95">
              <Badge
                variant="secondary"
                className="gap-1.5 px-3 py-1 text-sm font-semibold"
              >
                <CheckSquare className="w-3.5 h-3.5 text-primary" />
                {selectedIds.size}{' '}
                {selectedIds.size === 1 ? 'selecionado' : 'selecionados'}
              </Badge>
              <div className="h-6 w-px bg-border" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDuplicate}
                disabled={!!bulkActionLoading}
                className="gap-1.5"
              >
                {bulkActionLoading === 'duplicate' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                Duplicar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmBulkDelete(true)}
                disabled={!!bulkActionLoading}
                className="gap-1.5"
              >
                {bulkActionLoading === 'delete' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Excluir
              </Button>
              <div className="h-6 w-px bg-border" />
              <Button
                variant="ghost"
                size="sm"
                onClick={exitSelectionMode}
                disabled={!!bulkActionLoading}
                className="gap-1.5"
              >
                <X className="w-4 h-4" />
                Cancelar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post detail drawer */}
      <PostDetailDrawer
        post={detailPost}
        open={!!detailPost}
        onOpenChange={(v) => !v && setDetailPost(null)}
        onEdit={() => {
          if (detailPost) setEditing(detailPost)
          setDetailPost(null)
        }}
        onRefresh={refresh}
      />
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

function KanbanCard({
  post,
  statusColor,
  onOpen,
  onTransition,
  loading,
}: {
  post: any
  statusColor: string
  onOpen: (post: any) => void
  onTransition: (post: any, newStatus: string, scheduledAt?: string) => void
  loading: boolean
}) {
  const platforms = (post.targets || []).map((t: any) => t.platform)
  const [scheduling, setScheduling] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')

  const startScheduling = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(12, 0, 0, 0)
    setScheduleDate(toLocalInputValue(tomorrow.toISOString()))
    setScheduling(true)
  }

  const confirmSchedule = () => {
    if (!scheduleDate) {
      toast.error('Escolha uma data e hora')
      return
    }
    onTransition(post, 'scheduled', new Date(scheduleDate).toISOString())
    setScheduling(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25 }}
    >
      <Card
        role="button"
        tabIndex={0}
        onClick={() => onOpen(post)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onOpen(post)
          }
        }}
        className="relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <span
          className="absolute left-0 top-0 bottom-0 w-1 shrink-0"
          style={{ backgroundColor: statusColor }}
        />
        <div className="p-3 pl-4">
          <div className="font-semibold text-sm truncate mb-1.5">
            {post.title}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                backgroundColor: post.company?.brandColor || '#7C3AED',
              }}
            />
            <span className="truncate">{post.company?.name || '—'}</span>
          </div>
          {post.scheduledAt && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-2">
              <Calendar className="w-3 h-3" />
              {formatDateTime(post.scheduledAt)}
            </div>
          )}
          {platforms.length > 0 && (
            <div className="flex items-center gap-1 mb-2 flex-wrap">
              {platforms.map((p: string) => (
                <PlatformBadge key={p} platform={p} />
              ))}
            </div>
          )}

          {/* Transition buttons */}
          <div
            className="pt-2 border-t flex flex-wrap gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {post.status === 'draft' && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] gap-1"
                onClick={() => onTransition(post, 'review')}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <ArrowRight className="w-3 h-3" />
                )}
                Revisar
              </Button>
            )}
            {post.status === 'review' && (
              <>
                <Button
                  size="sm"
                  className="h-7 text-[11px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => onTransition(post, 'approved')}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900"
                  onClick={() => onTransition(post, 'draft')}
                  disabled={loading}
                >
                  <X className="w-3 h-3" />
                  Rejeitar
                </Button>
              </>
            )}
            {post.status === 'approved' && (
              <>
                {scheduling ? (
                  <div className="flex items-center gap-1.5 w-full">
                    <Input
                      type="datetime-local"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="h-7 text-[11px] flex-1"
                    />
                    <Button
                      size="sm"
                      className="h-7 text-[11px] gap-1 px-2 bg-emerald-600 hover:bg-emerald-700"
                      onClick={confirmSchedule}
                      disabled={loading || !scheduleDate}
                    >
                      {loading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      OK
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[11px] px-2"
                      onClick={() => setScheduling(false)}
                      disabled={loading}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] gap-1"
                    onClick={startScheduling}
                    disabled={loading}
                  >
                    <Calendar className="w-3 h-3" />
                    Agendar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[11px] gap-1"
                  onClick={() => onTransition(post, 'draft')}
                  disabled={loading}
                >
                  <RotateCcw className="w-3 h-3" />
                  Rascunho
                </Button>
              </>
            )}
            {(post.status === 'scheduled' || post.status === 'published') && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[11px] gap-1"
                onClick={() => onTransition(post, 'draft')}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RotateCcw className="w-3 h-3" />
                )}
                Voltar para rascunho
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

function KanbanColumn({
  title,
  statusColor,
  posts,
  onOpen,
  onTransition,
  loadingId,
}: {
  title: string
  statusColor: string
  posts: any[]
  onOpen: (post: any) => void
  onTransition: (post: any, newStatus: string, scheduledAt?: string) => void
  loadingId: string | null
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-muted/30 min-h-[200px]">
      <div
        className="h-1 rounded-t-xl shrink-0"
        style={{ backgroundColor: statusColor }}
      />
      <div className="p-3 pb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        <Badge variant="secondary" className="text-[10px]">
          {posts.length}
        </Badge>
      </div>
      <div className="flex-1 overflow-y-auto scroll-fancy px-3 pb-3 max-h-[600px] space-y-2">
        {posts.length === 0 ? (
          <div className="text-center py-6 text-[11px] text-muted-foreground/60">
            Vazio
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {posts.map((post) => (
              <KanbanCard
                key={post.id}
                post={post}
                statusColor={statusColor}
                onOpen={onOpen}
                onTransition={onTransition}
                loading={loadingId === post.id}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
