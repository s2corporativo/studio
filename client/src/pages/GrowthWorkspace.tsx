import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Bot, BrainCircuit, FileSearch, Loader2, Megaphone, ShieldCheck, Video } from "lucide-react";
import { useLocation } from "wouter";

const routeMeta: Record<string, { title: string; description: string; icon: typeof Video }> = {
  "/video": { title: "Video Studio", description: "Briefings, roteiros, cenas, textos de tela, capa e orientação de gravação.", icon: Video },
  "/seo": { title: "SEO & Local", description: "Auditorias de site, conteúdo, técnica e presença local com recomendações rastreáveis.", icon: FileSearch },
  "/ads": { title: "Ads Intelligence", description: "Planejamento de campanhas, público, oferta, conversão, custo máximo e criativos. Publicação continua dependente de aprovação.", icon: Megaphone },
  "/relatorios": { title: "Relatórios IA", description: "Relatórios semanais, mensais, executivos e de campanha com evidências e próximos passos.", icon: BarChart3 },
  "/agentes": { title: "Agentes especializados", description: "Rastreabilidade da atuação de estrategista, pesquisador, copywriter, diretor criativo, compliance, publisher e analista.", icon: Bot },
  "/memoria": { title: "Memória da marca", description: "Padrões vencedores, comportamentos a evitar e aprendizados de público, copy, criativo e canal.", icon: BrainCircuit },
  "/governanca": { title: "Compliance & Governança", description: "Checagens de publicidade jurídica, LGPD, direitos autorais, integridade de fontes, políticas de plataforma e brand safety.", icon: ShieldCheck },
};

export default function GrowthWorkspace() {
  const [location] = useLocation();
  const query = trpc.socialGrowth.workspace.useQuery(undefined, { staleTime: 30_000 });
  const meta = routeMeta[location] ?? routeMeta["/relatorios"];
  const Icon = meta.icon;

  if (query.isLoading) return <div className="saas-card flex min-h-[420px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#e2ba7c]" /></div>;
  if (query.isError || !query.data) return <div className="saas-card p-6 text-sm text-rose-300">{query.error?.message ?? "Não foi possível carregar o módulo."}</div>;

  const { videos, seo, ads, insights, memory, agents, compliance, reports } = query.data;
  let items: React.ReactNode = null;

  if (location === "/video") items = <List rows={videos} empty="Nenhum projeto de vídeo criado." render={(row: any) => <><strong>{row.title}</strong><small>{row.platform} · {row.durationSeconds}s · {row.status}</small></>} />;
  else if (location === "/seo") items = <List rows={seo} empty="Nenhuma auditoria SEO registrada." render={(row: any) => <><strong>{row.scope.toUpperCase()} · {row.keyword ?? row.targetUrl ?? "Auditoria"}</strong><small>Score {row.score}/100 · {row.status}</small></>} />;
  else if (location === "/ads") items = <List rows={ads} empty="Nenhum plano de mídia criado." render={(row: any) => <><strong>{row.name}</strong><small>{row.platform} · {row.objective} · {row.status} · aprovação obrigatória</small></>} />;
  else if (location === "/agentes") items = <List rows={agents} empty="Nenhuma execução de agente registrada." render={(row: any) => <><strong>{row.agentType}</strong><small>{row.status}{row.entityType ? ` · ${row.entityType}` : ""}</small></>} />;
  else if (location === "/memoria") items = <List rows={memory} empty="A memória estratégica ainda não possui aprendizados." render={(row: any) => <><strong>{row.title}</strong><small>{row.memoryType} · confiança {row.confidenceScore}%</small></>} />;
  else if (location === "/governanca") items = <List rows={compliance} empty="Nenhuma checagem de compliance registrada." render={(row: any) => <><strong>{row.checkType}</strong><small>{row.result} · {row.checkedBy}</small></>} />;
  else items = <List rows={reports} empty="Nenhum relatório gerado." render={(row: any) => <><strong>{row.reportType}</strong><small>{new Date(row.periodStart).toLocaleDateString("pt-BR")} → {new Date(row.periodEnd).toLocaleDateString("pt-BR")}</small></>} />;

  return <div className="space-y-6">
    <div>
      <div className="flex items-center gap-2 text-[#e2ba7c]"><Icon className="h-5 w-5" /><span className="text-[10px] font-bold uppercase tracking-[.18em]">Growth OS</span></div>
      <h1 className="mt-2 font-serif text-3xl text-[#f3ebdd]">{meta.title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#9aa89f]">{meta.description}</p>
    </div>

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

function List({ rows, empty, render }: { rows: any[]; empty: string; render: (row: any) => React.ReactNode }) {
  if (!rows.length) return <p className="text-sm text-[#8f9c93]">{empty}</p>;
  return <div className="space-y-2">{rows.map(row => <div key={row.id} className="flex flex-col gap-1 rounded-xl border border-white/[.06] bg-white/[.02] p-4 text-sm text-[#eee5d7]">{render(row)}</div>)}</div>;
}
