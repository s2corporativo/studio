'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CommandPalette } from '@/components/layout/command-palette'
import {
  Menu,
  Moon,
  Sun,
  Bell,
  Plus,
  Building2,
  ChevronDown,
  Check,
  CheckCheck,
  Sparkles,
  Image as ImageIcon,
  Lightbulb,
  CalendarClock,
  Share2,
  Building,
  CheckCircle2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import type { Company } from '@/lib/types'
import { apiPatch } from '@/lib/hooks'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const SECTION_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Painel Geral', subtitle: 'Visão consolidada das suas empresas' },
  companies: { title: 'Empresas', subtitle: 'Gerencie todas as suas marcas' },
  posts: { title: 'Posts & Agenda', subtitle: 'Calendário e publicações agendadas' },
  creator: { title: 'Criador com IA', subtitle: 'Gere conteúdo otimizado por inteligência artificial' },
  media: { title: 'Mídia & Imagens', subtitle: 'Gere imagens com IA para seus posts' },
  ideas: { title: 'Banco de Ideias', subtitle: 'Ideias de conteúdo geradas por IA' },
  social: { title: 'Redes Sociais', subtitle: 'Contas conectadas e métricas' },
  analytics: { title: 'Analytics', subtitle: 'Desempenho e alcance por plataforma' },
  seo: { title: 'SEO & Motores de IA', subtitle: 'Otimização para Google e ChatGPT, Perplexity, etc.' },
  settings: { title: 'Configurações', subtitle: 'Voz da marca, padrões de postagem e IA' },
}

export function TopBar() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const activeSection = useAppStore((s) => s.activeSection)
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId)
  const setSelectedCompany = useAppStore((s) => s.setSelectedCompany)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/companies')
      .then((r) => r.json())
      .then((d) => setCompanies(d.companies || []))
      .finally(() => setLoading(false))
  }, [])

  const selected = companies.find((c) => c.id === selectedCompanyId)
  const meta = SECTION_TITLES[activeSection] || SECTION_TITLES.dashboard

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-xl flex items-center gap-3 px-4 sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar}>
        <Menu className="w-5 h-5" />
      </Button>

      <div className="min-w-0 flex-1">
        <h2 className="font-semibold text-base sm:text-lg leading-tight truncate">{meta.title}</h2>
        <p className="text-xs text-muted-foreground truncate hidden sm:block">{meta.subtitle}</p>
      </div>

      {/* Command palette trigger */}
      <CommandPalette />

      {/* Company selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 h-9 max-w-[200px] sm:max-w-none">
            <Building2 className="w-4 h-4 shrink-0 text-primary" />
            <span className="truncate">{selected ? selected.name : 'Todas empresas'}</span>
            <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Filtrar por empresa
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setSelectedCompany(null)
              toast.success('Mostrando todas as empresas')
            }}
          >
            <Building2 className="w-4 h-4" />
            <span>Todas empresas</span>
            {!selectedCompanyId && <Check className="w-4 h-4 ml-auto text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {loading && (
            <DropdownMenuItem disabled>Carregando...</DropdownMenuItem>
          )}
          {companies.map((c) => (
            <DropdownMenuItem
              key={c.id}
              onClick={() => {
                setSelectedCompany(c.id)
                toast.success(`Filtrando: ${c.name}`)
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: c.brandColor || '#6366f1' }}
              />
              <span className="truncate">{c.name}</span>
              {selectedCompanyId === c.id && <Check className="w-4 h-4 ml-auto text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <NotificationsBell companyId={selectedCompanyId} />

      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => {
          toggleTheme()
          toast.success(`Modo ${theme === 'light' ? 'escuro' : 'claro'} ativado`)
        }}
      >
        {theme === 'light' ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
      </Button>

      <Button
        className="gap-2 h-9 hidden sm:flex"
        onClick={() => useAppStore.getState().setSection('creator')}
      >
        <Plus className="w-4 h-4" />
        <span>Novo Post</span>
      </Button>
    </header>
  )
}

const ICON_MAP: Record<string, any> = {
  'calendar-clock': CalendarClock,
  plus: CheckCircle2,
  image: ImageIcon,
  lightbulb: Lightbulb,
  building: Building,
  share: Share2,
  sparkles: Sparkles,
}

function NotificationsBell({ companyId }: { companyId: string | null }) {
  const [open, setOpen] = useState(false)
  const [events, setEvents] = useState<any[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchEvents = () => {
    const url = companyId ? `/api/activity?companyId=${companyId}&limit=25` : '/api/activity?limit=25'
    setLoading(true)
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.events || [])
        setUnread(d.unreadCount || 0)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    fetchEvents()
    const t = setInterval(fetchEvents, 30000)
    return () => clearInterval(t)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [companyId])

  const markAllRead = async () => {
    try {
      await apiPatch('/api/activity?action=mark-all-read', {})
      setUnread(0)
      setEvents((prev) => prev.map((e) => ({ ...e, read: true })))
      toast.success('Notificações marcadas como lidas')
    } catch {
      toast.error('Erro ao marcar notificações')
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={(v) => { setOpen(v); if (v) fetchEvents() }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="w-[18px] h-[18px]" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
          <div>
            <p className="text-sm font-semibold">Notificações</p>
            <p className="text-[11px] text-muted-foreground">
              {unread > 0 ? `${unread} não lida(s)` : 'Tudo em dia'}
            </p>
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={markAllRead}>
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar todas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : events.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <Bell className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma atividade ainda</p>
              <p className="text-[11px] text-muted-foreground/70 mt-1">
                Suas ações aparecerão aqui em tempo real
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {events.map((ev) => {
                const Icon = ICON_MAP[ev.icon || ''] || Sparkles
                const color = ev.color || '#7C3AED'
                return (
                  <div
                    key={ev.id}
                    className={`flex gap-3 px-3 py-2.5 hover:bg-accent/50 transition-colors ${!ev.read ? 'bg-primary/5' : ''}`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `color-mix(in oklch, ${color} 15%, transparent)`, color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-tight">{ev.title}</p>
                      {ev.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{ev.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(ev.createdAt), { addSuffix: true, locale: ptBR })}
                        {ev.company?.name ? ` · ${ev.company.name}` : ''}
                      </p>
                    </div>
                    {!ev.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
