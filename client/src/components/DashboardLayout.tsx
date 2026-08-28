import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import {
  BookOpenText,
  Bot,
  CalendarDays,
  FilePenLine,
  FolderKanban,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  Network,
  Radar,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const sections = [
  {
    label: "Workspace",
    items: [
      { icon: LayoutDashboard, label: "Visão geral", path: "/" },
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
      { icon: LibraryBig, label: "Biblioteca", path: "/biblioteca" },
      { icon: BookOpenText, label: "Fontes", path: "/fontes" },
      { icon: BookOpenText, label: "Conhecimento", path: "/conhecimento" },
    ],
  },
  {
    label: "Distribuição",
    items: [
      { icon: Network, label: "Redes sociais", path: "/redes" },
      { icon: ShieldCheck, label: "DNA da marca", path: "/marca" },
      { icon: Workflow, label: "Arquitetura", path: "/roadmap" },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) {
    return <div className="min-h-screen bg-[#050816] px-5 py-10 text-slate-100">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
        <div className="saas-card w-full p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/20"><Sparkles className="h-6 w-6" /></div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">De Paula Social OS</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Entre para acessar criação, agenda, radar e publicação nas redes sociais.</p>
          <Button onClick={() => startLogin()} className="saas-button-primary mt-7 w-full">Entrar no Social OS</Button>
        </div>
      </div>
    </div>;
  }

  return <SidebarProvider defaultOpen>
    <div className="flex min-h-screen w-full bg-[#050816] text-slate-100">
      <Sidebar collapsible="icon" className="border-r border-white/[.06] bg-[#070b14]/95 backdrop-blur-xl">
        <SidebarHeader className="border-b border-white/[.05] p-4">
          <button onClick={() => setLocation("/")} className="flex min-h-12 items-center gap-3 rounded-2xl px-2 text-left transition hover:bg-white/[.03]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 text-sm font-black text-white shadow-[0_0_35px_rgba(124,58,237,.28)]">DP</div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm font-semibold tracking-tight text-white">Social OS</p><p className="truncate text-[10px] uppercase tracking-[.16em] text-slate-600">De Paula Teixeira</p></div>
          </button>
        </SidebarHeader>
        <SidebarContent className="px-2 py-3">
          {sections.map(section => <div key={section.label} className="mb-4">
            <p className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[.18em] text-slate-700 group-data-[collapsible=icon]:hidden">{section.label}</p>
            <SidebarMenu>{section.items.map(item => {
              const active = location === item.path || (item.path === "/redes" && location === "/instagram");
              return <SidebarMenuItem key={item.path}><SidebarMenuButton onClick={() => setLocation(item.path)} isActive={active} tooltip={item.label} className="h-10 rounded-xl data-[active=true]:bg-violet-500/12 data-[active=true]:text-violet-200 data-[active=true]:shadow-[inset_0_0_0_1px_rgba(139,92,246,.15)]"><item.icon className={active ? "text-violet-300" : "text-slate-600"} /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>;
            })}</SidebarMenu>
          </div>)}
        </SidebarContent>
        <SidebarFooter className="border-t border-white/[.05] p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-white/[.04]"><Avatar className="h-9 w-9 border border-violet-400/20"><AvatarFallback className="bg-violet-500/10 text-xs text-violet-200">{user.name?.charAt(0)?.toUpperCase() ?? "U"}</AvatarFallback></Avatar><div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-xs font-medium text-slate-200">{user.name ?? "Usuário"}</p><p className="truncate text-[10px] text-slate-600">Conta ativa</p></div></button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right" className="w-48 border-white/10 bg-[#0b1120] text-slate-200"><DropdownMenuItem onClick={() => logout()} className="focus:bg-white/[.05] focus:text-white"><LogOut className="mr-2 h-4 w-4" />Sair</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0 bg-transparent">
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[.05] bg-[#050816]/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3"><SidebarTrigger className="text-slate-500 hover:text-white" /><div className="hidden h-5 w-px bg-white/[.06] sm:block" /><div className="hidden text-xs text-slate-600 sm:block">Marketing jurídico inteligente</div></div>
          <div className="flex items-center gap-2"><div className="hidden items-center gap-2 rounded-full border border-emerald-400/10 bg-emerald-400/[.04] px-3 py-1.5 text-[10px] font-medium text-emerald-300 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.8)]" />Sistema operacional</div></div>
        </div>
        <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </div>
  </SidebarProvider>;
}
