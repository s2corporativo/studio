'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Menu,
  Moon,
  Sun,
  Bell,
  Plus,
  Building2,
  ChevronDown,
  Check,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import type { Company } from '@/lib/types'

const SECTION_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Painel Geral', subtitle: 'Visão consolidada das suas empresas' },
  companies: { title: 'Empresas', subtitle: 'Gerencie todas as suas marcas' },
  posts: { title: 'Posts & Agenda', subtitle: 'Calendário e publicações agendadas' },
  creator: { title: 'Criador com IA', subtitle: 'Gere conteúdo otimizado por inteligência artificial' },
  social: { title: 'Redes Sociais', subtitle: 'Contas conectadas e métricas' },
  analytics: { title: 'Analytics', subtitle: 'Desempenho e alcance por plataforma' },
  seo: { title: 'SEO & Motores de IA', subtitle: 'Otimização para Google e ChatGPT, Perplexity, etc.' },
}

export function TopBar() {
  const { toggleSidebar, theme, toggleTheme, activeSection, selectedCompanyId, setSelectedCompany } =
    useAppStore()
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

      <Button variant="ghost" size="icon" className="relative h-9 w-9">
        <Bell className="w-[18px] h-[18px]" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
      </Button>

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
