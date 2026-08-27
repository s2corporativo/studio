import { Button } from "@/components/ui/button";
import { ArrowUpRight, Bot, CalendarClock, CheckCircle2, FilePenLine, Instagram, Radar, Sparkles, TrendingUp } from "lucide-react";

export default function SaasOverview({ data, counts, onCreate, onOpenCalendar, onOpenRadar, onOpenAutomation, onOpenNetworks }: any) {
  const upcoming = data.posts.filter((post: any) => post.scheduledAt).sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()).slice(0, 5);
  const pipeline = counts.review + counts.approved + counts.scheduled;
  return <div className="space-y-6">
    <section className="saas-hero overflow-hidden rounded-3xl p-6 sm:p-8">
      <div className="relative z-10 grid gap-8 xl:grid-cols-[1.25fr_.75fr] xl:items-end">
        <div><div className="saas-eyebrow"><Sparkles className="h-3.5 w-3.5" /> AI Social Operations</div><h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.035em] text-white sm:text-5xl">Conteúdo jurídico atual, visual premium e publicação sob controle.</h2><p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">Uma operação única para descobrir pautas, produzir, revisar, agendar e distribuir conteúdo nas redes sociais.</p><div className="mt-7 flex flex-wrap gap-3"><Button onClick={onCreate} className="saas-button-primary"><FilePenLine className="mr-2 h-4 w-4" />Criar conteúdo</Button><Button onClick={onOpenRadar} variant="outline" className="saas-button-secondary"><Radar className="mr-2 h-4 w-4" />Ver radar de hoje</Button></div></div>
        <div className="saas-glow-card p-5"><p className="text-xs font-medium text-slate-400">Fluxo pronto para operação</p><div className="mt-5 grid grid-cols-2 gap-3"><Metric label="Em produção" value={counts.draft + counts.review} /><Metric label="No pipeline" value={pipeline} /><Metric label="Agendados" value={counts.scheduled} /><Metric label="Publicados" value={counts.published} /></div></div>
      </div>
    </section>

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Action icon={Radar} label="Radar jurídico" text="Atualizações oficiais para novas pautas" onClick={onOpenRadar} accent="cyan" />
      <Action icon={Bot} label="Piloto automático" text="Cadência e políticas da operação" onClick={onOpenAutomation} accent="violet" />
      <Action icon={CalendarClock} label="Calendário" text="Planeje e acompanhe os próximos posts" onClick={onOpenCalendar} accent="blue" />
      <Action icon={Instagram} label="Redes sociais" text="Conexões, testes e publicação" onClick={onOpenNetworks} accent="pink" />
    </section>

    <section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
      <div className="saas-card p-6"><div className="flex items-center justify-between"><div><p className="saas-section-label">Pipeline editorial</p><h3 className="mt-1 text-xl font-semibold text-white">O que exige atenção</h3></div><TrendingUp className="h-5 w-5 text-violet-300" /></div><div className="mt-5 space-y-3">{data.posts.slice(0, 6).map((post: any) => <div key={post.id} className="flex items-center gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-[10px] font-bold text-violet-300">{post.area.slice(0,3).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-200">{post.title}</p><p className="mt-1 text-[11px] text-slate-500">{post.area} · {post.format}</p></div><span className="rounded-full border border-white/[.06] px-2.5 py-1 text-[10px] text-slate-400">{post.status}</span></div>)}{data.posts.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Nenhum conteúdo criado ainda.</p>}</div></div>
      <div className="saas-card p-6"><div className="flex items-center justify-between"><div><p className="saas-section-label">Próximas publicações</p><h3 className="mt-1 text-xl font-semibold text-white">Agenda</h3></div><CheckCircle2 className="h-5 w-5 text-emerald-300" /></div><div className="mt-5 space-y-4">{upcoming.map((post: any) => <div key={post.id} className="border-b border-white/[.06] pb-4 last:border-0 last:pb-0"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-200">{post.title}</p><p className="mt-1 text-xs text-slate-500">{new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(post.scheduledAt))}</p></div><ArrowUpRight className="h-4 w-4 text-slate-600" /></div></div>)}{upcoming.length === 0 && <div className="flex min-h-48 flex-col items-center justify-center text-center"><CalendarClock className="h-7 w-7 text-slate-700" /><p className="mt-3 text-sm font-medium text-slate-300">Agenda livre</p><p className="mt-1 text-xs text-slate-600">Aprove e programe os próximos conteúdos.</p></div>}</div></div>
    </section>
  </div>;
}

function Metric({ label, value }: any) { return <div className="rounded-2xl border border-white/[.06] bg-black/20 p-4"><p className="text-3xl font-semibold tracking-tight text-white">{value}</p><p className="mt-1 text-[11px] text-slate-500">{label}</p></div>; }
function Action({ icon: Icon, label, text, onClick, accent }: any) { return <button onClick={onClick} className="saas-card group p-5 text-left transition hover:-translate-y-0.5 hover:border-violet-400/30"><div className={`saas-icon saas-icon-${accent}`}><Icon className="h-5 w-5" /></div><div className="mt-5 flex items-center justify-between"><h3 className="font-semibold text-slate-100">{label}</h3><ArrowUpRight className="h-4 w-4 text-slate-600 transition group-hover:text-violet-300" /></div><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></button>; }
