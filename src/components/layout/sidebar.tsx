'use client'

import { useAppStore, type Section } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Sparkles,
  ImageIcon,
  Lightbulb,
  Hash,
  Share2,
  BarChart3,
  Target,
  Radar,
  Search,
  Settings,
  Zap,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const NAV: { id: Section; label: string; icon: any; description: string }[] = [
  { id: 'dashboard', label: 'Painel', icon: LayoutDashboard, description: 'Visão geral' },
  { id: 'companies', label: 'Empresas', icon: Building2, description: 'Gestão multi-marca' },
  { id: 'posts', label: 'Posts & Agenda', icon: CalendarDays, description: 'Calendário de publicações' },
  { id: 'creator', label: 'Criador IA', icon: Sparkles, description: 'Conteúdo com IA' },
  { id: 'media', label: 'Mídia & Imagens', icon: ImageIcon, description: 'Gerar com IA' },
  { id: 'ideas', label: 'Ideias', icon: Lightbulb, description: 'Banco de ideias IA' },
  { id: 'hashtags', label: 'Hashtags', icon: Hash, description: 'Banco de hashtags IA' },
  { id: 'social', label: 'Redes Sociais', icon: Share2, description: 'Contas conectadas' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Métricas & alcance' },
  { id: 'competitors', label: 'Concorrentes', icon: Target, description: 'Análise competitiva IA' },
  { id: 'listening', label: 'Menções', icon: Radar, description: 'Social listening IA' },
  { id: 'seo', label: 'SEO & IA', icon: Search, description: 'Google + motores de IA' },
  { id: 'settings', label: 'Configurações', icon: Settings, description: 'Voz da marca & IA' },
]

export function Sidebar() {
  const activeSection = useAppStore((s) => s.activeSection)
  const setSection = useAppStore((s) => s.setSection)
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const setSidebar = useAppStore((s) => s.setSidebar)

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebar(false)}
        />
      )}

      <aside
        className={cn(
          'z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300',
          'fixed lg:sticky top-0 h-screen',
          sidebarOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full lg:translate-x-0 lg:w-20'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-sidebar-border shrink-0">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center shadow-lg shadow-primary/30">
              <Zap className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-sidebar pulse-ring" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <h1 className="font-bold text-base leading-tight gradient-text">SocialHub</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Gestão com IA
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden h-8 w-8"
            onClick={() => setSidebar(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scroll-fancy p-3 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  setSection(item.id)
                  setSidebar(false)
                }}
                className={cn(
                  'group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all relative',
                  active
                    ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md shadow-primary/25'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className={cn('w-[18px] h-[18px] shrink-0', !sidebarOpen && 'mx-auto')} />
                {sidebarOpen && (
                  <div className="flex-1 min-w-0 text-left">
                    <div className="truncate">{item.label}</div>
                    <div
                      className={cn(
                        'text-[10px] truncate',
                        active ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      )}
                    >
                      {item.description}
                    </div>
                  </div>
                )}
                {active && sidebarOpen && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/80" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-3 border-t border-sidebar-border shrink-0">
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-fuchsia-500/10 p-3 border border-primary/20">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold">IA Ativa</span>
                <Badge variant="secondary" className="ml-auto text-[10px] h-5">
                  Pro
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Conteúdo e SEO gerados por IA em tempo real para suas empresas.
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
