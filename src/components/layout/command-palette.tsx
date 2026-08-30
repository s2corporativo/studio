'use client'

import { useEffect, useState } from 'react'
import { useAppStore, type Section } from '@/lib/store'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Sparkles,
  ImageIcon,
  Lightbulb,
  Share2,
  BarChart3,
  Search,
  Settings,
  Plus,
  Zap,
  Moon,
  Sun,
  Bell,
} from 'lucide-react'
import { toast } from 'sonner'

const NAV_ITEMS: { id: Section; label: string; icon: any; desc: string }[] = [
  { id: 'dashboard', label: 'Painel', icon: LayoutDashboard, desc: 'Visão geral' },
  { id: 'companies', label: 'Empresas', icon: Building2, desc: 'Gerenciar marcas' },
  { id: 'posts', label: 'Posts & Agenda', icon: CalendarDays, desc: 'Calendário de publicações' },
  { id: 'creator', label: 'Criador IA', icon: Sparkles, desc: 'Conteúdo com IA' },
  { id: 'media', label: 'Mídia & Imagens', icon: ImageIcon, desc: 'Gerar imagens com IA' },
  { id: 'ideas', label: 'Ideias', icon: Lightbulb, desc: 'Banco de ideias' },
  { id: 'social', label: 'Redes Sociais', icon: Share2, desc: 'Contas conectadas' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, desc: 'Métricas e alcance' },
  { id: 'seo', label: 'SEO & IA', icon: Search, desc: 'Otimização Google + IA' },
  { id: 'settings', label: 'Configurações', icon: Settings, desc: 'Voz da marca e IA' },
]

const ACTIONS = [
  { id: 'new-post', label: 'Criar novo post com IA', icon: Plus, section: 'creator' as Section, shortcut: 'N' },
  { id: 'generate-image', label: 'Gerar imagem com IA', icon: Sparkles, section: 'media' as Section, shortcut: 'G' },
  { id: 'generate-ideas', label: 'Gerar ideias de conteúdo', icon: Lightbulb, section: 'ideas' as Section, shortcut: 'I' },
  { id: 'toggle-theme', label: 'Alternar tema claro/escuro', icon: Sun, section: null, shortcut: 'T' },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const setSection = useAppStore((s) => s.setSection)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const theme = useAppStore((s) => s.theme)

  // Global keyboard shortcut Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      // Quick shortcuts when not typing in an input
      const tag = (e.target as HTMLElement)?.tagName
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable
      if (isInput || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault()
        setSection('creator')
        toast.info('Criador aberto')
      } else if (e.key.toLowerCase() === 'g') {
        e.preventDefault()
        setSection('media')
        toast.info('Mídia aberta')
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault()
        setSection('ideas')
        toast.info('Ideias aberto')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setSection])

  const go = (section: Section) => {
    setSection(section)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-muted/50 hover:bg-muted text-sm text-muted-foreground transition-colors min-w-[180px]"
        aria-label="Abrir busca rápida"
      >
        <Search className="w-4 h-4" />
        <span>Buscar ou ir para...</span>
        <kbd className="ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar seções, ações ou navegar..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Navegação">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <CommandItem
                  key={item.id}
                  value={`${item.label} ${item.desc} navegar secao`}
                  onSelect={() => go(item.id)}
                  className="gap-3"
                >
                  <Icon className="w-4 h-4 text-primary" />
                  <div className="flex-1">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground text-xs ml-2">{item.desc}</span>
                  </div>
                </CommandItem>
              )
            })}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Ações rápidas">
            {ACTIONS.map((action) => {
              const Icon = action.icon
              return (
                <CommandItem
                  key={action.id}
                  value={`${action.label} acao`}
                  onSelect={() => {
                    if (action.id === 'toggle-theme') {
                      toggleTheme()
                      toast.success(`Modo ${theme === 'light' ? 'escuro' : 'claro'} ativado`)
                    } else if (action.section) {
                      go(action.section)
                    }
                    setOpen(false)
                  }}
                  className="gap-3"
                >
                  <Icon className="w-4 h-4 text-fuchsia-500" />
                  <span className="flex-1">{action.label}</span>
                  {action.shortcut && (
                    <CommandShortcut>{action.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              )
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
