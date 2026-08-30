import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, Clock3, Flame, Loader2, Newspaper, RefreshCw, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

function dateLabel(value?: string | null) {
  if (!value) return "Atualização recente";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default function NewsRadar() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const radar = trpc.socialStudio.radar.useQuery(undefined, { staleTime: 5 * 60_000, refetchOnWindowFocus: false });
  const create = trpc.socialStudio.createFromRadar.useMutation({
    onSuccess: async () => {
      await utils.socialStudio.data.invalidate();
      setLocation("/conteudos");
    },
  });

  return <div className="space-y-6">
    <section className="saas-hero rounded-3xl p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="saas-eyebrow"><Flame className="h-3.5 w-3.5" /> Radar jurídico de fontes públicas</div>
          <h2 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight text-[#f3ebdd] sm:text-5xl">Transforme atualidade jurídica em conteúdo com procedência.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#aab6ad]">O radar consulta fontes públicas quando solicitado e mantém a URL original vinculada ao rascunho para revisão jurídica.</p>
        </div>
        <Button onClick={() => radar.refetch()} disabled={radar.isFetching} variant="outline" className="saas-button-secondary">
          {radar.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Consultar fontes
        </Button>
      </div>
    </section>

    {radar.isError && <div className="saas-card p-5 text-sm text-rose-300">Não foi possível consultar as fontes agora. Nenhum conteúdo será criado sem fonte.</div>}

    <section className="grid gap-4 xl:grid-cols-2">
      {(radar.data ?? []).map((item, index: number) => <article key={item.id} className="saas-card group p-5 transition hover:-translate-y-0.5 hover:border-[#c99550]/30">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#c99550]/10 text-[#e3bd7f] ring-1 ring-inset ring-[#c99550]/20">
            {index < 3 ? <Flame className="h-5 w-5" /> : <Newspaper className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
              <span className="text-[#e3bd7f]">{item.source}</span><span>•</span><span>{dateLabel(item.publishedAt)}</span>
              <span className="ml-auto rounded-full bg-emerald-400/10 px-2.5 py-1 text-emerald-300">{item.score}/100</span>
            </div>
            <h3 className="mt-3 text-lg font-semibold leading-6 text-slate-100">{item.title}</h3>
            {item.summary && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{item.summary}</p>}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button onClick={() => create.mutate({ title: item.title, url: item.url, source: item.source, summary: item.summary, area: item.area })} disabled={create.isPending} size="sm" className="saas-button-primary">
                {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Criar publicação
              </Button>
              <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white">Abrir fonte <ArrowUpRight className="h-3.5 w-3.5" /></a>
              <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-slate-500"><Clock3 className="h-3.5 w-3.5" />{item.area}</span>
            </div>
          </div>
        </div>
      </article>)}
    </section>

    {!radar.isLoading && (radar.data?.length ?? 0) === 0 && <div className="saas-card flex min-h-56 flex-col items-center justify-center p-8 text-center"><Newspaper className="h-8 w-8 text-slate-600" /><p className="mt-4 font-semibold text-slate-200">Nenhuma atualização disponível</p><p className="mt-1 text-sm text-slate-500">As fontes oficiais podem estar temporariamente indisponíveis.</p></div>}
  </div>;
}
