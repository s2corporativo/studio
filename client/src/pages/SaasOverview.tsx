import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, CalendarClock, CheckCircle2, Clock3, FilePenLine, Instagram, Radar, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ContentPost } from "../../../drizzle/schema";

type OverviewData = { posts: ContentPost[] };
type OverviewCounts = Record<ContentPost["status"], number>;
type OverviewProps = {
  data: OverviewData;
  counts: OverviewCounts;
  onCreate: () => void;
  onOpenCalendar: () => void;
  onOpenRadar: () => void;
  onOpenAutomation: () => void;
  onOpenNetworks: () => void;
};

const statusLabel: Record<ContentPost["status"], string> = {
  draft: "Em produção",
  review: "Em revisão",
  approved: "Aprovado",
  scheduled: "Agendado",
  published: "Publicado",
  rejected: "Ajustes necessários",
};

function formatSchedule(value: ContentPost["scheduledAt"]) {
  if (!value) return "Sem data definida";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default function SaasOverview({ data, counts, onCreate, onOpenCalendar, onOpenRadar, onOpenAutomation, onOpenNetworks }: OverviewProps) {
  const upcoming = data.posts.filter(post => post.scheduledAt).sort((a, b) => new Date(a.scheduledAt ?? 0).getTime() - new Date(b.scheduledAt ?? 0).getTime()).slice(0, 4);
  const attentionPosts = data.posts.filter(post => post.status === "review" || post.status === "approved" || post.status === "scheduled").slice(0, 4);
  const metrics = [
    { icon: FilePenLine, label: "Em produção", value: counts.draft + counts.review, detail: `${counts.review} em revisão`, accent: "bronze" },
    { icon: ShieldCheck, label: "Aprovações pendentes", value: counts.review, detail: "Revisão humana ativa", accent: "green" },
    { icon: CalendarClock, label: "Agendados", value: counts.scheduled, detail: "Com confirmação exigida", accent: "gold" },
    { icon: TrendingUp, label: "Publicados", value: counts.published, detail: "Histórico rastreável", accent: "clay" },
  ];

  return <div className="studio-overview space-y-5">
    <section className="studio-overview-heading">
      <div>
        <p className="studio-overview-kicker">De Paula Teixeira Advocacia</p>
        <h1>Visão geral da operação</h1>
        <p>Acompanhe o conteúdo jurídico em produção, as aprovações e a distribuição responsável.</p>
      </div>
      <div className="studio-overview-actions"><Button variant="outline" className="studio-light-button" onClick={onOpenRadar}><Radar className="mr-2 h-4 w-4" />Radar jurídico</Button><Button className="studio-new-entry" onClick={onCreate}><FilePenLine className="mr-2 h-4 w-4" />Nova entrada</Button></div>
    </section>

    <section className="studio-brand-strip">
      <img src="/manus-storage/de-paula-teixeira-logo-horizontal_1699e4a9.webp" alt="Logomarca De Paula Teixeira Advocacia" className="h-16 w-[250px] object-contain object-left sm:h-20 sm:w-[310px]" />
      <div className="studio-brand-copy"><span>Social Media OS</span><p>Planejamento, criação e divulgação sob governança editorial.</p></div>
    </section>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(metric => <MetricCard key={metric.label} {...metric} />)}
    </section>

    <section className="grid gap-5 xl:grid-cols-[1.55fr_.85fr]">
      <div className="studio-light-card studio-pipeline-card">
        <div className="studio-card-heading"><div><p className="studio-card-kicker">Pipeline editorial</p><h2>Conteúdos que exigem atenção</h2></div><button onClick={onCreate} className="studio-text-action">Criar conteúdo <ArrowRight className="h-4 w-4" /></button></div>
        <div className="mt-4 divide-y divide-[#e7ebe5]">
          {attentionPosts.map(post => <article key={post.id} className="studio-content-row"><div className="studio-row-area">{post.area.slice(0, 3).toUpperCase()}</div><div className="min-w-0 flex-1"><h3>{post.title}</h3><p>{post.area} · {post.format}</p></div><span className="studio-status-chip">{statusLabel[post.status]}</span><ArrowRight className="h-4 w-4 text-[#a4aca5]" /></article>)}
          {attentionPosts.length === 0 && <div className="studio-empty-state"><CheckCircle2 className="h-5 w-5" /><p>Não há itens aguardando decisão editorial.</p><button onClick={onCreate}>Criar primeiro conteúdo</button></div>}
        </div>
      </div>

      <aside className="studio-intelligence-card">
        <div className="flex items-start justify-between gap-4"><div className="studio-intelligence-icon"><Sparkles className="h-5 w-5" /></div><span>REVISÃO HUMANA ATIVA</span></div>
        <h2>Inteligência editorial</h2>
        <p>Encontre pautas em fontes oficiais, transforme sinais em rascunhos e preserve a trilha de validação jurídica.</p>
        <button onClick={onOpenRadar} className="studio-intelligence-search"><Radar className="h-4 w-4" />Abrir Radar Jurídico <ArrowRight className="ml-auto h-4 w-4" /></button>
        <div className="mt-5 flex flex-wrap gap-2"><button onClick={onOpenRadar}>Fontes oficiais</button><button onClick={onCreate}>Novo rascunho</button></div>
      </aside>
    </section>

    <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <div className="studio-light-card">
        <div className="studio-card-heading"><div><p className="studio-card-kicker">Agenda editorial</p><h2>Próximas publicações</h2></div><button onClick={onOpenCalendar} className="studio-text-action">Calendário <ArrowRight className="h-4 w-4" /></button></div>
        <div className="mt-4 space-y-1">
          {upcoming.map(post => <article className="studio-agenda-row" key={post.id}><time><Clock3 className="h-4 w-4" />{formatSchedule(post.scheduledAt)}</time><div><h3>{post.title}</h3><p>{post.area} · {statusLabel[post.status]}</p></div></article>)}
          {upcoming.length === 0 && <div className="studio-empty-state"><CalendarClock className="h-5 w-5" /><p>A agenda editorial está livre.</p><button onClick={onOpenCalendar}>Planejar calendário</button></div>}
        </div>
      </div>

      <div className="studio-light-card studio-workspace-card">
        <div className="studio-card-heading"><div><p className="studio-card-kicker">Atalhos operacionais</p><h2>Fluxo sob controle</h2></div><Bot className="h-5 w-5 text-[#b98238]" /></div>
        <div className="mt-4 grid gap-2"><WorkspaceLink icon={Radar} label="Radar jurídico" text="Fontes permitidas e novas pautas" onClick={onOpenRadar} /><WorkspaceLink icon={CalendarClock} label="Automação assistida" text="Cadência com aprovação humana" onClick={onOpenAutomation} /><WorkspaceLink icon={Instagram} label="Redes sociais" text="Conexões e pré-publicação" onClick={onOpenNetworks} /></div>
      </div>
    </section>
  </div>;
}

function MetricCard({ icon: Icon, label, value, detail, accent }: { icon: LucideIcon; label: string; value: number; detail: string; accent: string }) {
  return <div className={`studio-metric-card studio-metric-${accent}`}><div className="studio-metric-icon"><Icon className="h-4 w-4" /></div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div>;
}

function WorkspaceLink({ icon: Icon, label, text, onClick }: { icon: LucideIcon; label: string; text: string; onClick: () => void }) {
  return <button onClick={onClick} className="studio-workspace-link"><span><Icon className="h-4 w-4" /></span><div><strong>{label}</strong><small>{text}</small></div><ArrowRight className="ml-auto h-4 w-4" /></button>;
}
