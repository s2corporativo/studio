import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, Clock3, Flame, Loader2, Newspaper, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

function dateLabel(value?: string | null) {
  if (!value) return "Data não verificada";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function freshnessLabel(status: "fresh" | "aging" | "expired" | "needs_date_verification") {
  if (status === "fresh") return "Atual";
  if (status === "aging") return "Revalidar em breve";
  if (status === "expired") return "Expirado";
  return "Data pendente";
}

export default function NewsRadar() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const radar = trpc.socialStudio.radar.useQuery(undefined, { staleTime: 5 * 60_000, refetchOnWindowFocus: false });
  const workspaces = trpc.brandWorkspaces.list.useQuery(undefined, { staleTime: 30_000 });
  const defaultWorkspaceId = workspaces.data?.find(workspace => workspace.isDefault && workspace.status === "active")?.id ?? null;
  const create = trpc.brandWorkspaces.createFromRadar.useMutation({
    onSuccess: async () => {
      await utils.socialStudio.data.invalidate();
      toast.success("Rascunho criado a partir da fonte oficial e vinculado à marca padrão.");
      setLocation("/conteudos");
    },
    onError: error => toast.error(error.message),
  });

  function createFromRadar(radarItemId: string) {
    if (!defaultWorkspaceId) {
      toast.error("Defina uma marca padrão ativa antes de criar conteúdo pelo Radar.");
      setLocation("/marcas");
      return;
    }
    create.mutate({ brandWorkspaceId: defaultWorkspaceId, radarItemId });
  }

  return <div className="space-y-6">
    <section className="saas-hero rounded-3xl p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="saas-eyebrow"><Flame className="h-3.5 w-3.5" /> Radar jurídico de fontes públicas</div>
          <h2 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight text-[#f3ebdd] sm:text-5xl">Transforme atualidade jurídica em conteúdo com procedência.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#aab6ad]">O servidor consulta novamente a fonte oficial antes de criar qualquer rascunho. Itens sem data confiável, resumo ou validade editorial suficiente ficam disponíveis apenas para inspeção humana.</p>
        </div>
        <Button onClick={() => radar.refetch()} disabled={radar.isFetching} variant="outline" className="saas-button-secondary">
          {radar.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Consultar fontes
        </Button>
      </div>
    </section>

    {radar.isError && <div className="saas-card p-5 text-sm text-rose-300">Não foi possível consultar as fontes agora. Nenhum conteúdo será criado sem fonte.</div>}

    <section className="grid gap-4 xl:grid-cols-2">
      {(radar.data ?? []).map((item, index: number) => {
        const canCreate = Boolean(item.publishedAt && item.summary && (item.freshnessStatus === "fresh" || item.freshnessStatus === "aging"));
        return <article key={item.id} className="saas-card group p-5 transition hover:-translate-y-0.5 hover:border-[#c99550]/30">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#c99550]/10 text-[#e3bd7f] ring-1 ring-inset ring-[#c99550]/20">
              {index < 3 ? <Flame className="h-5 w-5" /> : <Newspaper className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
                <span className="text-[#e3bd7f]">{item.source}</span><span>•</span><span>{dateLabel(item.publishedAt)}</span>
                <span className="rounded-full bg-white/[.04] px-2.5 py-1 text-slate-400">{freshnessLabel(item.freshnessStatus)}</span>
                <span className="ml-auto rounded-full bg-emerald-400/10 px-2.5 py-1 text-emerald-300">{item.score}/100</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold leading-6 text-slate-100">{item.title}</h3>
              {item.summary && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{item.summary}</p>}
              {!item.summary && <p className="mt-2 text-xs leading-5 text-amber-300">Resumo não disponível; exige leitura e validação humana antes de virar conteúdo.</p>}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button onClick={() => createFromRadar(item.id)} disabled={create.isPending || workspaces.isLoading || !canCreate} size="sm" className="saas-button-primary">
                  {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}{canCreate ? "Criar publicação" : "Revisão manual necessária"}
                </Button>
                <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white">Abrir fonte <ArrowUpRight className="h-3.5 w-3.5" /></a>
                <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-slate-500"><Clock3 className="h-3.5 w-3.5" />{item.area}</span>
              </div>
            </div>
          </div>
        </article>;
      })}
    </section>

    {!radar.isLoading && (radar.data?.length ?? 0) === 0 && <div className="saas-card flex min-h-56 flex-col items-center justify-center p-8 text-center"><Newspaper className="h-8 w-8 text-slate-600" /><p className="mt-4 font-semibold text-slate-200">Nenhuma atualização disponível</p><p className="mt-1 text-sm text-slate-500">As fontes oficiais podem estar temporariamente indisponíveis.</p></div>}
  </div>;
}
