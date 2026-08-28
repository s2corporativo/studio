import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, BarChart3, Bot, Building2, Inbox, Lightbulb, Loader2, Target, Users } from "lucide-react";
import { toast } from "sonner";

function scoreTone(score: number) {
  if (score >= 80) return "text-emerald-300";
  if (score >= 60) return "text-amber-300";
  return "text-slate-300";
}

export default function SocialOsCommandCenter() {
  const utils = trpc.useUtils();
  const dashboard = trpc.socialOs.dashboard.useQuery();
  const opportunities = trpc.socialOs.opportunities.useQuery();
  const interactions = trpc.socialOs.interactions.useQuery();
  const leads = trpc.socialOs.leads.useQuery();
  const competitors = trpc.socialOs.competitors.useQuery();
  const rules = trpc.socialOs.automationRules.useQuery();

  const setOpportunityStatus = trpc.socialOs.setOpportunityStatus.useMutation({
    onSuccess: async () => { await Promise.all([utils.socialOs.opportunities.invalidate(), utils.socialOs.dashboard.invalidate()]); toast.success("Oportunidade atualizada."); },
    onError: error => toast.error(error.message),
  });
  const setLeadStatus = trpc.socialOs.setLeadStatus.useMutation({
    onSuccess: async () => { await Promise.all([utils.socialOs.leads.invalidate(), utils.socialOs.dashboard.invalidate()]); toast.success("Lead atualizado."); },
    onError: error => toast.error(error.message),
  });
  const setAutomationEnabled = trpc.socialOs.setAutomationEnabled.useMutation({
    onSuccess: async () => { await utils.socialOs.automationRules.invalidate(); toast.success("Automação atualizada."); },
    onError: error => toast.error(error.message),
  });

  if (dashboard.isLoading) return <div className="saas-card flex min-h-[420px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#e2ba7c]" /></div>;
  if (dashboard.isError) return <div className="saas-card p-6 text-rose-300">{dashboard.error.message}</div>;

  const summary = dashboard.data;
  const metrics = [
    { label: "Oportunidades novas", value: summary?.newOpportunities ?? 0, icon: Lightbulb },
    { label: "Interações abertas", value: summary?.openInteractions ?? 0, icon: Inbox },
    { label: "Revisão humana", value: summary?.waitingHuman ?? 0, icon: AlertTriangle },
    { label: "Novos leads", value: summary?.newLeads ?? 0, icon: Users },
  ];

  return <div className="space-y-6">
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#b8945d]">Social Media OS</p>
        <h1 className="mt-1 font-serif text-3xl text-[#f3ebdd]">Command Center</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#9aa89f]">Inteligência, oportunidades, atendimento, leads, concorrência, automações e aprendizado de desempenho em uma única operação.</p>
      </div>
      <Badge className="w-fit border-[#c99550]/20 bg-[#c99550]/10 text-[#e7c58f]">Aprovação humana preservada</Badge>
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map(item => <Card key={item.label} className="border-[#daba7d]/10 bg-[#10201b] text-[#f3ebdd]">
        <CardContent className="flex items-center justify-between p-5">
          <div><p className="text-xs text-[#91a097]">{item.label}</p><p className="mt-2 text-3xl font-semibold">{item.value}</p></div>
          <div className="rounded-2xl bg-[#c99550]/10 p-3 text-[#e2ba7c]"><item.icon className="h-5 w-5" /></div>
        </CardContent>
      </Card>)}
    </div>

    <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
      <Card className="border-[#daba7d]/10 bg-[#10201b] text-[#f3ebdd]">
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Target className="h-5 w-5 text-[#e2ba7c]" />Radar de oportunidades</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(opportunities.data ?? []).slice(0, 8).map(item => <div key={item.id} className="rounded-2xl border border-white/[.06] bg-white/[.02] p-4">
            <div className="flex items-start justify-between gap-4"><div><p className="font-medium">{item.title}</p><p className="mt-1 text-xs text-[#8f9c93]">{item.area ?? "Geral"}{item.sourceName ? ` · ${item.sourceName}` : ""}</p></div><div className={`text-xl font-semibold ${scoreTone(item.totalScore)}`}>{item.totalScore}</div></div>
            {item.rationale && <p className="mt-3 text-sm leading-6 text-[#a9b4ad]">{item.rationale}</p>}
            <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setOpportunityStatus.mutate({ id: item.id, status: "selected" })}>Selecionar</Button><Button size="sm" variant="ghost" onClick={() => setOpportunityStatus.mutate({ id: item.id, status: "dismissed" })}>Ignorar</Button></div>
          </div>)}
          {!opportunities.data?.length && <p className="text-sm text-[#8f9c93]">Nenhuma oportunidade cadastrada ainda.</p>}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-[#daba7d]/10 bg-[#10201b] text-[#f3ebdd]"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Inbox className="h-5 w-5 text-[#e2ba7c]" />Inbox inteligente</CardTitle></CardHeader><CardContent className="space-y-3">{(interactions.data ?? []).slice(0, 6).map(item => <div key={item.id} className="rounded-xl border border-white/[.06] p-3"><div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{item.authorName ?? item.authorHandle ?? "Contato"}</span><Badge variant="outline">{item.kind}</Badge></div><p className="mt-2 line-clamp-3 text-xs leading-5 text-[#9aa89f]">{item.body}</p>{item.requiresHumanApproval && <p className="mt-2 text-[11px] text-amber-300">Requer revisão humana</p>}</div>)}{!interactions.data?.length && <p className="text-sm text-[#8f9c93]">Nenhuma interação recebida.</p>}</CardContent></Card>

        <Card className="border-[#daba7d]/10 bg-[#10201b] text-[#f3ebdd]"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Users className="h-5 w-5 text-[#e2ba7c]" />Leads</CardTitle></CardHeader><CardContent className="space-y-3">{(leads.data ?? []).slice(0, 6).map(item => <div key={item.id} className="rounded-xl border border-white/[.06] p-3"><div className="flex items-center justify-between"><span className="text-sm font-medium">{item.name ?? item.interest ?? "Lead"}</span><Badge variant="outline">{item.status}</Badge></div><div className="mt-2 flex gap-2"><Button size="sm" variant="ghost" onClick={() => setLeadStatus.mutate({ id: item.id, status: "qualified" })}>Qualificar</Button><Button size="sm" variant="ghost" onClick={() => setLeadStatus.mutate({ id: item.id, status: "contacted" })}>Contatado</Button></div></div>)}{!leads.data?.length && <p className="text-sm text-[#8f9c93]">Nenhum lead registrado.</p>}</CardContent></Card>
      </div>
    </div>

    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="border-[#daba7d]/10 bg-[#10201b] text-[#f3ebdd]"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Building2 className="h-5 w-5 text-[#e2ba7c]" />Concorrência</CardTitle></CardHeader><CardContent className="space-y-2">{(competitors.data ?? []).slice(0, 6).map(item => <div key={item.id} className="rounded-xl border border-white/[.06] p-3"><p className="text-sm font-medium">{item.name}</p><p className="mt-1 text-xs text-[#8f9c93]">{item.active ? "Monitoramento ativo" : "Pausado"}</p></div>)}{!competitors.data?.length && <p className="text-sm text-[#8f9c93]">Cadastre concorrentes públicos para comparação estratégica.</p>}</CardContent></Card>

      <Card className="border-[#daba7d]/10 bg-[#10201b] text-[#f3ebdd]"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Bot className="h-5 w-5 text-[#e2ba7c]" />Automações</CardTitle></CardHeader><CardContent className="space-y-2">{(rules.data ?? []).slice(0, 6).map(item => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[.06] p-3"><div><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-[#8f9c93]">{item.triggerType} → {item.actionType}</p></div><Button size="sm" variant={item.enabled ? "default" : "outline"} onClick={() => setAutomationEnabled.mutate({ id: item.id, enabled: !item.enabled })}>{item.enabled ? "Ativa" : "Ativar"}</Button></div>)}{!rules.data?.length && <p className="text-sm text-[#8f9c93]">Nenhuma regra configurada.</p>}</CardContent></Card>

      <Card className="border-[#daba7d]/10 bg-[#10201b] text-[#f3ebdd]"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-5 w-5 text-[#e2ba7c]" />Analytics & aprendizado</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-[#9aa89f]">Snapshots de alcance, impressões, engajamento, cliques e leads já possuem estrutura própria. Esses dados alimentam decisões futuras de tema, formato e horário sem substituir aprovação humana.</p></CardContent></Card>
    </div>
  </div>;
}
