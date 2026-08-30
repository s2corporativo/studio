import {
  BarChart3, BookOpenText, Bot, BrainCircuit, CalendarDays, FilePenLine, FileSearch,
  FolderKanban, Inbox, LayoutDashboard, LibraryBig, Megaphone, Network,
  Radar, ScrollText, ShieldCheck, Sparkles, Target, Users, Video, Workflow, Zap, type LucideIcon,
} from "lucide-react";

export type NavigationItem = { icon: LucideIcon; label: string; path: string };
export type NavigationSection = { label: string; items: NavigationItem[] };

export const commandCenterPaths = new Set(["/command-center", "/inteligencia", "/inbox", "/leads", "/concorrencia", "/analytics"]);

export const navigationSections: NavigationSection[] = [
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
      { icon: Sparkles, label: "SocialHub — Integrações", path: "/socialhub" },
      { icon: Zap, label: "Funcionalidades Avançadas", path: "/avancado" },
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
