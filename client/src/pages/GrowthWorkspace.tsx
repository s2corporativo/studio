import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Bot, BrainCircuit, FileSearch, Loader2, Megaphone, ShieldCheck, Sparkles, Video } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const routeMeta: Record<string, { title: string; description: string; icon: typeof Video }> = {
  "/video": { title: "Video Studio", description: "Briefings, roteiros, cenas, textos de tela, capa e orientação de gravação.", icon: Video },
  "/seo": { title: "SEO & Local", description: "Auditorias reais de site, conteúdo, técnica e presença local com recomendações rastreáveis.", icon: FileSearch },
  "/ads": { title: "Ads Intelligence", description: "Planejamento de campanhas, público, oferta, conversão, custo máximo e criativos. Nenhuma campanha é publicada por este módulo.", icon: Megaphone },
  "/relatorios": { title: "Relatórios IA", description: "Relatórios semanais, mensais, executivos e de campanha calculados sobre métricas registradas no sistema.", icon: BarChart3 },
  "/agentes": { title: "Agentes especializados", description: "Rastreabilidade da atuação de estrategista, pesquisador, copywriter, diretor criativo, compliance, publisher e analista.", icon: Bot },
  "/memoria": { title: "Memória da marca", description: "Padrões vencedores, comportamentos a evitar e aprendizados de público, copy, criativo e canal.", icon: BrainCircuit },
  "/governanca": { title: "Compliance & Governança", description: "Checagens de publicidade jurídica, LGPD, direitos autorais, integridade de fontes, políticas de plataforma e brand safety.", icon: ShieldCheck },
};

function localDateInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export default function GrowthWorkspace() {
  const [location] = useLocation();
  const utils = trpc.useUtils();
  const query = trpc.socialGrowth.workspace.useQuery(undefined, { staleTime: 30_000 });
  const meta = routeMeta[location] ?? routeMeta["/relatorios"];
  const Icon = meta.icon;

  const [video, setVideo] = useState({ title: "", platform: "instagram", durationSeconds: 45, audience: "", objective: "Autoridade e educação", source: "" });
  const [seo, setSeo] = useState({ targetUrl: "https://", scope: "technical", location: "", keyword: "" });
  const [ads, setAds] = useState({ platform: "meta", name: "", objective: "Leads qualificados", audience: "", location: "", offer: "", budget: "", durationDays: 30, landingPageUrl: "" });
  const defaultEnd = useMemo(() => new Date(), []);
  const defaultStart = useMemo(() => { const value = new Date(); value.setDate(value.getDate() - 30); return value; }, []);
  const [report, setReport] = useState({ reportType: "monthly", periodStart: localDateInput(defaultStart), periodEnd: localDateInput(defaultEnd) });

  const refresh = async () => { await utils.socialGrowth.workspace.invalidate(); };
  const videoMutation = trpc.socialIntelligence.generateVideoProject.useMutation({ onSuccess: async () => { await refresh(); toast.success("Roteiro e direção de vídeo gerados."); setVideo(current => ({ ...current, title: "", source: "" })); }, onError: error => toast.error(error.message) });
  const seoMutation = trpc.socialIntelligence.auditSeo.useMutation({ onSuccess: async result => { await refresh(); toast.success(`Auditoria SEO concluída: ${result.score}/100.`); }, onError: error => toast.error(error.message) });
  const adsMutation = trpc.socialIntelligence.planAds.useMutation({ onSuccess: async () => { await refresh(); toast.success("Plano de mídia criado como rascunho para aprovação."); }, onError: error => toast.error(error.message) });
  const reportMutation = trpc.socialIntelligence.generatePerformanceReport.useMutation({ onSuccess: async result => { await refresh(); toast.success(`Relatório gerado com ${result.insightsCreated} aprendizado(s).`); }, onError: error => toast.error(error.message) });

  if (query.isLoading) return <div className="saas-card flex min-h-[420px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#e2ba7c]" /></div>;
  if (query.isError || !query.data) return <div className="saas-card p-6 text-sm text-rose-300">{query.error?.message ?? "Não foi possível carregar o módulo."}</div>;

  const { videos, seo: seoRows, ads: adRows, insights, memory, agents, compliance, reports } = query.data;
  let items: React.ReactNode = null;
  if (location === "/video") items = <List rows={videos} empty="Nenhum projeto de vídeo criado." render={(row: any) => <><strong>{row.title}</strong><small>{row.platform} · {row.durationSeconds}s · {row.status}</small>{row.hook && <p className="mt-2 text-xs leading-5 text-[#a8b3ab]">Gancho: {row.hook}</p>}</>} />;
  else if (location === "/seo") items = <List rows={seoRows} empty="Nenhuma auditoria SEO registrada." render={(row: any) => <><strong>{row.scope.toUpperCase()} · {row.keyword ?? row.targetUrl ?? "Auditoria"}</strong><small>Score {row.score}/100 · {row.status}</small></>} />;
  else if (location === "/ads") items = <List rows={adRows} empty="Nenhum plano de mídia criado." render={(row: any) => <><strong>{row.name}</strong><small>{row.platform} · {row.objective} · {row.status} · aprovação obrigatória</small></>} />;
  else if (location === "/agentes") items = <List rows={agents} empty="Nenhuma execução de agente registrada." render={(row: any) => <><strong>{row.agentType}</strong><small>{row.status}{row.entityType ? ` · ${row.entityType}` : ""}{row.durationMs ? ` · ${row.durationMs} ms` : ""}</small>{row.errorMessage && <p className="mt-2 text-xs text-rose-300">{row.errorMessage}</p>}</>} />;
  else if (location === "/memoria") items = <List rows={memory} empty="A memória estratégica ainda não possui aprendizados." render={(row: any) => <><strong>{row.title}</strong><small>{row.memoryType} · confiança {row.confidenceScore}%</small><p className="mt-2 text-xs leading-5 text-[#a8b3ab]">{row.content}</p></>} />;
  else if (location === "/governanca") items = <List rows={compliance} empty="Nenhuma checagem de compliance registrada." render={(row: any) => <><strong>{row.checkType}</strong><small>{row.result} · {row.checkedBy}</small></>} />;
  else items = <List rows={reports} empty="Nenhum relatório gerado." render={(row: any) => <><strong>{row.reportType}</strong><small>{new Date(row.periodStart).toLocaleDateString("pt-BR")} → {new Date(row.periodEnd).toLocaleDateString("pt-BR")}</small><p className="mt-2 text-xs leading-5 text-[#a8b3ab]">{row.summary}</p></>} />;

  return <div className="space-y-6">
    <div>
      <div className="flex items-center gap-2 text-[#e2ba7c]"><Icon className="h-5 w-5" /><span className="text-[10px] font-bold uppercase tracking-[.18em]">Growth OS</span></div>
      <h1 className="mt-2 font-serif text-3xl text-[#f3ebdd]">{meta.title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#9aa89f]">{meta.description}</p>
    </div>

    {(location === "/video" || location === "/seo" || location === "/ads" || location === "/relatorios") && <Card className="border-[#daba7d]/10 bg-[#10201b] text-[#f3ebdd]">
      <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5 text-[#e2ba7c]" />Executar módulo</CardTitle></CardHeader>
      <CardContent>
        {location === "/video" && <form className="grid gap-4 md:grid-cols-2" onSubmit={(event: FormEvent) => { event.preventDefault(); videoMutation.mutate({ postId: null, title: video.title, platform: video.platform as any, durationSeconds: Number(video.durationSeconds), audience: video.audience, objective: video.objective, source: video.source || null, tone: null }); }}>
          <Field label="Tema"><input required value={video.title} onChange={e => setVideo({ ...video, title: e.target.value })} /></Field>
          <Field label="Plataforma"><select value={video.platform} onChange={e => setVideo({ ...video, platform: e.target.value })}><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="linkedin">LinkedIn</option><option value="tiktok">TikTok</option><option value="youtube">YouTube</option></select></Field>
          <Field label="Público"><input required value={video.audience} onChange={e => setVideo({ ...video, audience: e.target.value })} /></Field>
          <Field label="Duração (segundos)"><input type="number" min={10} max={600} required value={video.durationSeconds} onChange={e => setVideo({ ...video, durationSeconds: Number(e.target.value) })} /></Field>
          <Field label="Objetivo"><input required value={video.objective} onChange={e => setVideo({ ...video, objective: e.target.value })} /></Field>
          <Field label="Fonte verificável, quando aplicável"><input value={video.source} onChange={e => setVideo({ ...video, source: e.target.value })} placeholder="https://..." /></Field>
          <div className="md:col-span-2"><Button type="submit" disabled={videoMutation.isPending} className="saas-button-primary">{videoMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Gerar roteiro profissional</Button></div>
        </form>}

        {location === "/seo" && <form className="grid gap-4 md:grid-cols-2" onSubmit={(event: FormEvent) => { event.preventDefault(); seoMutation.mutate({ targetUrl: seo.targetUrl, scope: seo.scope as any, location: seo.location || null, keyword: seo.keyword || null }); }}>
          <Field label="URL HTTPS pública"><input required type="url" value={seo.targetUrl} onChange={e => setSeo({ ...seo, targetUrl: e.target.value })} /></Field>
          <Field label="Escopo"><select value={seo.scope} onChange={e => setSeo({ ...seo, scope: e.target.value })}><option value="technical">Técnico</option><option value="site">Site</option><option value="content">Conteúdo</option><option value="local">SEO Local</option></select></Field>
          <Field label="Localização"><input value={seo.location} onChange={e => setSeo({ ...seo, location: e.target.value })} placeholder="Cidade/UF" /></Field>
          <Field label="Palavra-chave"><input value={seo.keyword} onChange={e => setSeo({ ...seo, keyword: e.target.value })} /></Field>
          <div className="md:col-span-2"><Button type="submit" disabled={seoMutation.isPending} className="saas-button-primary">{seoMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Auditar página real</Button></div>
        </form>}

        {location === "/ads" && <form className="grid gap-4 md:grid-cols-2" onSubmit={(event: FormEvent) => { event.preventDefault(); adsMutation.mutate({ platform: ads.platform as any, name: ads.name, objective: ads.objective, audience: ads.audience, location: ads.location || null, offer: ads.offer || null, budgetCents: ads.budget ? Math.round(Number(ads.budget.replace(",", ".")) * 100) : null, durationDays: Number(ads.durationDays), landingPageUrl: ads.landingPageUrl || null }); }}>
          <Field label="Nome do plano"><input required value={ads.name} onChange={e => setAds({ ...ads, name: e.target.value })} /></Field>
          <Field label="Plataforma"><select value={ads.platform} onChange={e => setAds({ ...ads, platform: e.target.value })}><option value="meta">Meta Ads</option><option value="google">Google Ads</option><option value="youtube">YouTube Ads</option><option value="linkedin">LinkedIn Ads</option><option value="tiktok">TikTok Ads</option></select></Field>
          <Field label="Objetivo"><input required value={ads.objective} onChange={e => setAds({ ...ads, objective: e.target.value })} /></Field>
          <Field label="Público"><input required value={ads.audience} onChange={e => setAds({ ...ads, audience: e.target.value })} /></Field>
          <Field label="Localização"><input value={ads.location} onChange={e => setAds({ ...ads, location: e.target.value })} /></Field>
          <Field label="Oferta / proposta"><input value={ads.offer} onChange={e => setAds({ ...ads, offer: e.target.value })} /></Field>
          <Field label="Orçamento planejado (R$)"><input type="number" min={0} step="0.01" value={ads.budget} onChange={e => setAds({ ...ads, budget: e.target.value })} /></Field>
          <Field label="Duração (dias)"><input type="number" min={1} max={365} value={ads.durationDays} onChange={e => setAds({ ...ads, durationDays: Number(e.target.value) })} /></Field>
          <Field label="Landing page"><input type="url" value={ads.landingPageUrl} onChange={e => setAds({ ...ads, landingPageUrl: e.target.value })} placeholder="https://..." /></Field>
          <div className="flex items-end"><Button type="submit" disabled={adsMutation.isPending} className="saas-button-primary">{adsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar plano para aprovação</Button></div>
          <p className="md:col-span-2 text-xs leading-5 text-amber-200/80">Este módulo apenas planeja. Não publica campanha, não realiza pagamento e não aumenta orçamento.</p>
        </form>}

        {location === "/relatorios" && <form className="grid gap-4 md:grid-cols-3" onSubmit={(event: FormEvent) => { event.preventDefault(); reportMutation.mutate({ reportType: report.reportType as any, periodStart: new Date(`${report.periodStart}T00:00:00`), periodEnd: new Date(`${report.periodEnd}T23:59:59`) }); }}>
          <Field label="Tipo"><select value={report.reportType} onChange={e => setReport({ ...report, reportType: e.target.value })}><option value="weekly">Semanal</option><option value="monthly">Mensal</option><option value="campaign">Campanha</option><option value="executive">Executivo</option></select></Field>
          <Field label="Início"><input type="date" required value={report.periodStart} onChange={e => setReport({ ...report, periodStart: e.target.value })} /></Field>
          <Field label="Fim"><input type="date" required value={report.periodEnd} onChange={e => setReport({ ...report, periodEnd: e.target.value })} /></Field>
          <div className="md:col-span-3"><Button type="submit" disabled={reportMutation.isPending} className="saas-button-primary">{reportMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Gerar relatório com evidências</Button></div>
        </form>}
      </CardContent>
    </Card>}

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Metric label="Insights ativos" value={insights.length} />
      <Metric label="Memórias da marca" value={memory.length} />
      <Metric label="Agentes registrados" value={agents.length} />
      <Metric label="Checagens compliance" value={compliance.length} />
    </div>

    <Card className="border-[#daba7d]/10 bg-[#10201b] text-[#f3ebdd]">
      <CardHeader className="flex-row items-center justify-between"><CardTitle className="text-lg">Registros recentes</CardTitle><Badge variant="outline" className="border-[#c99550]/20 text-[#e2ba7c]">dados reais do workspace</Badge></CardHeader>
      <CardContent>{items}</CardContent>
    </Card>

    {insights.length > 0 && <Card className="border-[#daba7d]/10 bg-[#10201b] text-[#f3ebdd]"><CardHeader><CardTitle className="text-lg">Aprendizados recomendados</CardTitle></CardHeader><CardContent className="space-y-3">{insights.slice(0, 5).map((item: any) => <div key={item.id} className="rounded-xl border border-white/[.06] p-4"><div className="flex items-start justify-between gap-3"><strong className="text-sm">{item.title}</strong><span className="text-xs text-[#e2ba7c]">{item.confidenceScore}%</span></div><p className="mt-2 text-xs leading-5 text-[#9aa89f]">{item.recommendation}</p></div>)}</CardContent></Card>}
  </div>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="saas-card p-5"><p className="text-xs text-[#8f9c93]">{label}</p><p className="mt-2 text-3xl font-semibold text-[#f3ebdd]">{value}</p></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="saas-field"><span>{label}</span>{children}</label>;
}

function List({ rows, empty, render }: { rows: any[]; empty: string; render: (row: any) => React.ReactNode }) {
  if (!rows.length) return <p className="text-sm text-[#8f9c93]">{empty}</p>;
  return <div className="space-y-2">{rows.map(row => <div key={row.id} className="flex flex-col gap-1 rounded-xl border border-white/[.06] bg-white/[.02] p-4 text-sm text-[#eee5d7]">{render(row)}</div>)}</div>;
}
