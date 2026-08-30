import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import {
  BarChart3, BookOpenText, Bot, BrainCircuit, CalendarDays, FilePenLine, FileSearch,
  FolderKanban, Inbox, LayoutDashboard, LibraryBig, LogOut, Megaphone, Network,
  Moon, Radar, ScrollText, ShieldCheck, Sparkles, Sun, Target, Users, Video, Workflow,
} from "lucide-react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { useTheme } from "@/contexts/ThemeContext";

const commandCenterPaths = new Set(["/command-center", "/inteligencia", "/inbox", "/leads", "/concorrencia", "/analytics"]);

const sections = [
  {
    label: "Workspace",
    items: [
      { icon: LayoutDashboard, label: "Visão geral", path: "/" },
      { icon: BrainCircuit, label: "Command Center", path: "/command-center" },
      { icon: Radar, label: "Radar jurídico", path: "/radar" },
      { icon: FilePenLine, label: "Conteúdos", path: "/conteudos" },
      { icon: CalendarDays, label: "Calendário", path: "/calendario" },
      { icon: Bot, label: "Automação", path: "/automacao" },
      { icon: FolderKanban, label: "Planejamento", path: "/planejamento" },
    ],
  },
  {
    label: "Inteligência",
    items: [
      { icon: Target, label: "Oportunidades", path: "/inteligencia" },
      { icon: Inbox, label: "Inbox inteligente", path: "/inbox" },
      { icon: Users, label: "Leads", path: "/leads" },
      { icon: Network, label: "Concorrência", path: "/concorrencia" },
      { icon: BarChart3, label: "Analytics", path: "/analytics" },
      { icon: BrainCircuit, label: "Memória da marca", path: "/memoria" },
      { icon: Bot, label: "Agentes IA", path: "/agentes" },
      { icon: LibraryBig, label: "Biblioteca", path: "/biblioteca" },
      { icon: BookOpenText, label: "Fontes", path: "/fontes" },
      { icon: BookOpenText, label: "Conhecimento", path: "/conhecimento" },
    ],
  },
  {
    label: "Criação & Crescimento",
    items: [
      { icon: Video, label: "Video Studio", path: "/video" },
      { icon: FileSearch, label: "SEO & Local", path: "/seo" },
      { icon: Megaphone, label: "Ads Intelligence", path: "/ads" },
      { icon: ScrollText, label: "Relatórios IA", path: "/relatorios" },
    ],
  },
  {
    label: "Distribuição & Governança",
    items: [
      { icon: Network, label: "Redes sociais", path: "/redes" },
      { icon: ShieldCheck, label: "Compliance", path: "/governanca" },
      { icon: ShieldCheck, label: "DNA da marca", path: "/marca" },
      { icon: Workflow, label: "Arquitetura", path: "/roadmap" },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();

  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) {
    return <div className="min-h-screen bg-[#0c1715] px-5 py-10 text-[#f3ebdd]">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
        <div className="saas-card w-full p-8 text-center">
          <img src="/manus-storage/de-paula-teixeira-logo-horizontal_1699e4a9.webp" alt="De Paula Teixeira Advocacia" className="mx-auto h-16 w-56 object-contain" />
          <h1 className="mt-6 font-serif text-3xl tracking-tight">De Paula Social Studio</h1>
          <p className="mt-2 text-sm leading-6 text-[#9aa89f]">Entre para acessar inteligência, criação, agenda, publicação responsável e análise de desempenho.</p>
          <Button onClick={() => startLogin()} className="saas-button-primary mt-7 w-full">Entrar no Social Studio</Button>
        </div>
      </div>
    </div>;
  }

  return <SidebarProvider defaultOpen>
    <div className="flex min-h-screen w-full bg-[#f4f6f1] text-[#172520]">
      <Sidebar collapsible="icon" className="border-r border-[#12382d] bg-[#061813] text-[#e9eee7]">
        <SidebarHeader className="border-b border-[#daba7d]/15 p-3">
          <button onClick={() => setLocation("/")} className="flex min-h-14 w-full items-center rounded-xl px-1 text-left transition hover:bg-white/[.04]">
            <img src="/manus-storage/de-paula-teixeira-logo-horizontal_1699e4a9.webp" alt="De Paula Teixeira Advocacia" className="h-12 w-[188px] object-contain object-center group-data-[collapsible=icon]:w-11" />
          </button>
        </SidebarHeader>
        <SidebarContent className="px-2 py-3">
          {sections.map(section => <div key={section.label} className="mb-4">
            <p className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[.18em] text-[#8e9b90] group-data-[collapsible=icon]:hidden">{section.label}</p>
            <SidebarMenu>{section.items.map(item => {
              const active = location === item.path || (item.path === "/redes" && location === "/instagram") || (item.path === "/command-center" && commandCenterPaths.has(location));
              return <SidebarMenuItem key={item.path}><SidebarMenuButton onClick={() => setLocation(item.path)} isActive={active} tooltip={item.label} className="h-10 rounded-xl data-[active=true]:bg-[#c99550]/12 data-[active=true]:text-[#f1d29e] data-[active=true]:shadow-[inset_0_0_0_1px_rgba(201,149,80,.20)]"><item.icon className={active ? "text-[#e2ba7c]" : "text-[#829188]"} /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>;
            })}</SidebarMenu>
          </div>)}
        </SidebarContent>
        <SidebarFooter className="border-t border-[#daba7d]/15 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-white/[.04]"><Avatar className="h-9 w-9 border border-[#c99550]/25"><AvatarFallback className="bg-[#c99550]/10 text-xs text-[#e7c58f]">{user.name?.charAt(0)?.toUpperCase() ?? "U"}</AvatarFallback></Avatar><div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-xs font-medium text-[#eee5d7]">{user.name ?? "Usuário"}</p><p className="truncate text-[10px] text-[#8f9c93]">Conta ativa</p></div></button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right" className="w-48 border-[#daba7d]/15 bg-[#12221e] text-[#eee5d7]"><DropdownMenuItem onClick={() => logout()} className="focus:bg-white/[.05] focus:text-white"><LogOut className="mr-2 h-4 w-4" />Sair</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0 bg-[#f4f6f1]">
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#d9ded5] bg-[#fcfdf9]/92 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3"><SidebarTrigger className="text-[#506158] hover:text-[#17352b]" /><div className="hidden h-5 w-px bg-[#d9ded5] sm:block" /><div className="hidden text-xs font-medium text-[#6d7c72] sm:block">Social Media OS · operação responsável</div></div>
          <div className="flex items-center gap-2"><button type="button" onClick={toggleTheme} aria-label={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"} aria-pressed={theme === "dark"} className="studio-theme-toggle" title={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}>{theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}<span className="hidden sm:inline">{theme === "light" ? "Escuro" : "Claro"}</span></button><div className="hidden items-center gap-2 rounded-full border border-[#c99550]/30 bg-[#fffaf0] px-3 py-1.5 text-[10px] font-semibold text-[#77511f] sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-[#b98238] shadow-[0_0_8px_rgba(185,130,56,.40)]" />Controle editorial ativo</div></div>
        </div>
        <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </div>
  </SidebarProvider>;
}
