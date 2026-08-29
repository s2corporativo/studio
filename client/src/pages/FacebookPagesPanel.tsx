import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Facebook, Link2, Loader2, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

export default function FacebookPagesPanel() {
  const utils = trpc.useUtils();
  const profilesQuery = trpc.socialStudio.socialProfiles.useQuery();
  const statusQuery = trpc.facebookPages.status.useQuery(undefined, { refetchOnWindowFocus: false });
  const [notice, setNotice] = useState<string | null>(null);
  const facebookProfiles = useMemo(() => (profilesQuery.data ?? []).filter(profile => profile.network === "facebook" && profile.state !== "inactive"), [profilesQuery.data]);
  const pages = statusQuery.data?.pages ?? [];

  const begin = trpc.facebookPages.beginConnection.useMutation({
    onSuccess: ({ authorizationUrl }) => window.location.assign(authorizationUrl),
    onError: error => setNotice(error.message),
  });
  const selectPage = trpc.facebookPages.selectPage.useMutation({
    onSuccess: async page => {
      setNotice(`Página ${page.accountName ?? page.externalAccountId} selecionada.`);
      await Promise.all([utils.facebookPages.status.invalidate(), utils.externalIntegrations.status.invalidate(), utils.socialStudio.socialProfiles.invalidate()]);
    },
    onError: error => setNotice(error.message),
  });
  const test = trpc.facebookPages.testConnection.useMutation({
    onSuccess: result => setNotice(`Conexão validada com ${result.pageName ?? result.pageId}.`),
    onError: error => setNotice(error.message),
  });

  return <section className="saas-card overflow-hidden">
    <div className="border-b border-white/8 px-5 py-5 sm:px-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="saas-eyebrow"><Facebook className="h-3.5 w-3.5" /> Facebook Pages</div>
          <h3 className="mt-2 text-xl font-semibold text-white">Conexão oficial por OAuth</h3>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">O Studio não armazena senha do Facebook. Após a autorização, apenas tokens das Páginas administradas são protegidos no servidor. Se houver mais de uma Página, a escolha é manual.</p>
        </div>
        <Badge variant="outline" className={statusQuery.data?.configured ? "border-amber-300/25 bg-amber-300/10 text-amber-100" : "border-white/10 text-slate-500"}>{statusQuery.data?.configured ? "Aplicação configurada" : "Aguardando configuração"}</Badge>
      </div>
    </div>

    <div className="space-y-5 p-5 sm:p-7">
      {notice && <div role="status" className="flex items-start gap-2 border border-[#c99550]/20 bg-[#c99550]/8 px-4 py-3 text-xs text-[#f5edde]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#e3bd7f]" />{notice}</div>}

      <div>
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-500">1. Autorizar perfil</p>
        {facebookProfiles.length === 0 ? <p className="mt-3 text-sm text-slate-500">Cadastre primeiro o perfil público do Facebook na seção de perfis externos.</p> : <div className="mt-3 flex flex-wrap gap-2">{facebookProfiles.map(profile => <Button key={profile.id} size="sm" variant="outline" className="saas-button-secondary" disabled={begin.isPending || !statusQuery.data?.configured} onClick={() => begin.mutate({ profileId: profile.id })}>{begin.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Link2 className="mr-2 h-3.5 w-3.5" />}Conectar {profile.displayName}</Button>)}</div>}
      </div>

      <div className="border-t border-white/7 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-500">2. Página administrada</p>
        {statusQuery.isLoading ? <p className="mt-3 text-sm text-slate-500">Consultando conexões protegidas...</p> : pages.length === 0 ? <p className="mt-3 text-sm text-slate-500">Nenhuma Página foi autorizada ainda.</p> : <div className="mt-3 grid gap-3 md:grid-cols-2">{pages.map(page => <article key={page.externalAccountId} className="border border-white/8 bg-black/10 p-4"><div className="flex items-start justify-between gap-3"><div><h4 className="text-sm font-semibold text-white">{page.accountName ?? "Página do Facebook"}</h4><p className="mt-1 text-[11px] text-slate-600">ID {page.externalAccountId}</p></div><Badge variant="outline" className={page.state === "connected" ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100" : "border-white/10 text-slate-500"}>{page.state === "connected" ? "Selecionada" : "Disponível"}</Badge></div>{page.state !== "connected" && <Button size="sm" variant="outline" className="saas-button-secondary mt-4" disabled={selectPage.isPending} onClick={() => selectPage.mutate({ pageId: page.externalAccountId })}>Usar esta Página</Button>}</article>)}</div>}
      </div>

      <div className="border-t border-white/7 pt-5"><Button size="sm" variant="outline" className="saas-button-secondary" disabled={test.isPending || !pages.some(page => page.state === "connected")} onClick={() => test.mutate()}>{test.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}Testar Página selecionada</Button></div>
    </div>
  </section>;
}
