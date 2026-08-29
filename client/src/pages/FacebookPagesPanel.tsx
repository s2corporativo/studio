import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, CheckCircle2, Facebook, Link2, Loader2, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

const jobLabels = {
  pending_confirmation: "Aguardando confirmação",
  processing: "Processando",
  published: "Publicado",
  failed: "Falhou — retry permitido",
  unknown_outcome: "Resultado incerto",
  cancelled: "Cancelado",
} as const;

export default function FacebookPagesPanel() {
  const utils = trpc.useUtils();
  const profilesQuery = trpc.socialStudio.socialProfiles.useQuery();
  const studioQuery = trpc.socialStudio.data.useQuery();
  const statusQuery = trpc.facebookPages.status.useQuery(undefined, { refetchOnWindowFocus: false });
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [link, setLink] = useState("");
  const [confirmJobId, setConfirmJobId] = useState<number | null>(null);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const facebookProfiles = useMemo(() => (profilesQuery.data ?? []).filter(profile => profile.network === "facebook" && profile.state !== "inactive"), [profilesQuery.data]);
  const approvedPosts = useMemo(() => (studioQuery.data?.posts ?? []).filter(post => post.status === "approved" || post.status === "scheduled"), [studioQuery.data?.posts]);
  const pages = statusQuery.data?.pages ?? [];
  const jobs = statusQuery.data?.jobs ?? [];
  const hasConnectedPage = pages.some(page => page.state === "connected");

  const refresh = async () => Promise.all([utils.facebookPages.status.invalidate(), utils.externalIntegrations.status.invalidate(), utils.socialStudio.socialProfiles.invalidate(), utils.socialStudio.data.invalidate()]);
  const begin = trpc.facebookPages.beginConnection.useMutation({ onSuccess: ({ authorizationUrl }) => window.location.assign(authorizationUrl), onError: error => setNotice(error.message) });
  const selectPage = trpc.facebookPages.selectPage.useMutation({ onSuccess: async page => { setNotice(`Página ${page.accountName ?? page.externalAccountId} selecionada.`); await refresh(); }, onError: error => setNotice(error.message) });
  const test = trpc.facebookPages.testConnection.useMutation({ onSuccess: result => setNotice(`Conexão validada com ${result.pageName ?? result.pageId}.`), onError: error => setNotice(error.message) });
  const requestPublication = trpc.facebookPages.requestPublication.useMutation({
    onSuccess: async job => {
      setNotice(job.alreadyPublished ? `Este conteúdo já foi publicado neste job (${job.externalPostId ?? "ID externo registrado"}).` : `Job #${job.id} preparado. Revise e confirme explicitamente antes da publicação.`);
      setConfirmJobId(job.id);
      setConfirmationChecked(false);
      await refresh();
    },
    onError: error => setNotice(error.message),
  });
  const confirmPublication = trpc.facebookPages.confirmPublication.useMutation({
    onSuccess: async result => {
      setNotice(result.idempotent ? `Job #${result.jobId} já estava publicado; nenhuma segunda publicação foi criada.` : `Publicação concluída. ID externo: ${result.externalPostId ?? "registrado"}.`);
      setConfirmJobId(null);
      setConfirmationChecked(false);
      await refresh();
    },
    onError: async error => { setNotice(error.message); await refresh(); },
  });

  return <section className="saas-card overflow-hidden">
    <div className="border-b border-white/8 px-5 py-5 sm:px-7"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><div className="saas-eyebrow"><Facebook className="h-3.5 w-3.5" /> Facebook Pages</div><h3 className="mt-2 text-xl font-semibold text-white">Conexão oficial e publicação controlada</h3><p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">O Studio não armazena senha do Facebook. Apenas Page Access Tokens ficam cifrados. Publicação exige conteúdo aprovado, job congelado e uma segunda confirmação humana.</p></div><Badge variant="outline" className={statusQuery.data?.configured ? "border-amber-300/25 bg-amber-300/10 text-amber-100" : "border-white/10 text-slate-500"}>{statusQuery.data?.configured ? "Aplicação configurada" : "Aguardando configuração"}</Badge></div></div>
    <div className="space-y-6 p-5 sm:p-7">
      {notice && <div role="status" className="flex items-start gap-2 border border-[#c99550]/20 bg-[#c99550]/8 px-4 py-3 text-xs text-[#f5edde]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#e3bd7f]" />{notice}</div>}

      <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-500">1. Autorizar perfil</p>{facebookProfiles.length === 0 ? <p className="mt-3 text-sm text-slate-500">Cadastre primeiro o perfil público do Facebook na seção de perfis externos.</p> : <div className="mt-3 flex flex-wrap gap-2">{facebookProfiles.map(profile => <Button key={profile.id} size="sm" variant="outline" className="saas-button-secondary" disabled={begin.isPending || !statusQuery.data?.configured} onClick={() => begin.mutate({ profileId: profile.id })}>{begin.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Link2 className="mr-2 h-3.5 w-3.5" />}Conectar {profile.displayName}</Button>)}</div>}</div>

      <div className="border-t border-white/7 pt-5"><p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-500">2. Página administrada</p>{statusQuery.isLoading ? <p className="mt-3 text-sm text-slate-500">Consultando conexões protegidas...</p> : pages.length === 0 ? <p className="mt-3 text-sm text-slate-500">Nenhuma Página foi autorizada ainda.</p> : <div className="mt-3 grid gap-3 md:grid-cols-2">{pages.map(page => <article key={page.externalAccountId} className="border border-white/8 bg-black/10 p-4"><div className="flex items-start justify-between gap-3"><div><h4 className="text-sm font-semibold text-white">{page.accountName ?? "Página do Facebook"}</h4><p className="mt-1 text-[11px] text-slate-600">ID {page.externalAccountId}</p></div><Badge variant="outline" className={page.state === "connected" ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100" : "border-white/10 text-slate-500"}>{page.state === "connected" ? "Selecionada" : "Disponível"}</Badge></div>{page.state !== "connected" && <Button size="sm" variant="outline" className="saas-button-secondary mt-4" disabled={selectPage.isPending} onClick={() => selectPage.mutate({ pageId: page.externalAccountId })}>Usar esta Página</Button>}</article>)}</div>}<Button size="sm" variant="outline" className="saas-button-secondary mt-4" disabled={test.isPending || !hasConnectedPage} onClick={() => test.mutate()}>{test.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}Testar Página selecionada</Button></div>

      <div className="border-t border-white/7 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-500">3. Preparar publicação</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">Somente conteúdos com aprovação vigente podem gerar um job. Preparar não publica nada.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <select value={selectedPostId ?? ""} onChange={event => setSelectedPostId(event.target.value ? Number(event.target.value) : null)} className="editorial-input w-full"><option value="">Selecione um conteúdo aprovado</option>{approvedPosts.map(post => <option key={post.id} value={post.id}>{post.title}</option>)}</select>
          <Input value={link} onChange={event => setLink(event.target.value)} type="url" placeholder="Link HTTPS opcional" className="editorial-input" />
          <Button className="saas-button-primary" disabled={!hasConnectedPage || !selectedPostId || requestPublication.isPending} onClick={() => selectedPostId && requestPublication.mutate({ postId: selectedPostId, link: link.trim() || null })}>{requestPublication.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}Preparar job</Button>
        </div>
      </div>

      <div className="border-t border-white/7 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-500">4. Revisar e confirmar</p>
        {jobs.length === 0 ? <p className="mt-3 text-sm text-slate-500">Nenhum job de Facebook preparado.</p> : <div className="mt-3 space-y-3">{jobs.map(job => {
          const canConfirm = job.status === "pending_confirmation" || job.status === "failed";
          const uncertain = job.status === "unknown_outcome";
          return <article key={job.id} className="border border-white/8 bg-black/10 p-4"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-start"><div><div className="flex items-center gap-2"><h4 className="text-sm font-semibold text-white">Job #{job.id} · conteúdo #{job.postId}</h4><Badge variant="outline" className={job.status === "published" ? "border-emerald-300/25 text-emerald-100" : uncertain ? "border-orange-300/25 text-orange-100" : "border-white/10 text-slate-400"}>{jobLabels[job.status]}</Badge></div><p className="mt-2 text-[11px] text-slate-600">Tentativas: {job.attemptCount}{job.externalPostId ? ` · ID externo: ${job.externalPostId}` : ""}</p>{job.lastError && <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">{job.lastError}</p>}</div>{canConfirm && <Button size="sm" variant="outline" className="saas-button-secondary" onClick={() => { setConfirmJobId(job.id); setConfirmationChecked(false); }}>Revisar confirmação</Button>}</div>
          {uncertain && <div className="mt-3 flex items-start gap-2 border border-orange-300/20 bg-orange-300/8 p-3 text-xs leading-5 text-orange-100"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />Não repita este job. Verifique a Página manualmente antes de qualquer reconciliação para evitar postagem duplicada.</div>}
          {confirmJobId === job.id && canConfirm && <div className="mt-4 border-t border-white/7 pt-4"><label className="flex items-start gap-3 text-xs leading-5 text-slate-300"><input type="checkbox" checked={confirmationChecked} onChange={event => setConfirmationChecked(event.target.checked)} className="mt-1" /><span>Confirmo que revisei o conteúdo aprovado e autorizo esta publicação externa específica no Facebook.</span></label><Button className="saas-button-primary mt-3" disabled={!confirmationChecked || confirmPublication.isPending} onClick={() => confirmPublication.mutate({ jobId: job.id, confirmedByHuman: true })}>{confirmPublication.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Confirmar e publicar</Button></div>}
          </article>;
        })}</div>}
      </div>
    </div>
  </section>;
}
