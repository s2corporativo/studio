import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Bot, CalendarRange, CheckCircle2, Clock3, Loader2, Radar, ShieldCheck, WandSparkles } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function AutomationCenter({ settings }: { settings: any }) {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState<any>(settings ?? { enabled: false, cadence: "weekdays", postsPerWeek: 5, defaultPublishTime: "18:30", planningHorizonDays: 30, requireApproval: true, refreshRadarDaily: true, preferredAreas: "", preferredFormats: "carousel,post,reel" });
  const [planDays, setPlanDays] = useState<7 | 15 | 30>(30);
  const [planMessage, setPlanMessage] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const update = trpc.socialStudio.updateAutomation.useMutation({ onSuccess: async data => { setForm(data); await utils.socialStudio.data.invalidate(); } });
  const generateCampaign = trpc.socialCampaign.generate.useMutation({ onSuccess: async result => { setPlanMessage(`${result.count} conteúdos foram criados como rascunhos e distribuídos ao longo do período em America/Sao_Paulo${result.reused ? " (solicitação já processada; sem duplicação)" : ""}.`); await utils.socialStudio.data.invalidate(); }, onError: error => setPlanMessage(error.message) });
  useEffect(() => setForm(settings ?? form), [settings?.id]);
  const submit = (event: FormEvent) => { event.preventDefault(); update.mutate({ ...form, postsPerWeek: Number(form.postsPerWeek), planningHorizonDays: Number(form.planningHorizonDays), preferredAreas: form.preferredAreas || null, preferredFormats: form.preferredFormats || null }); };

  return <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
    <form onSubmit={submit} className="saas-card p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div><div className="saas-eyebrow"><Bot className="h-3.5 w-3.5" /> Planejamento assistido</div><h2 className="mt-3 font-serif text-3xl tracking-tight text-[#f3ebdd]">Defina o ritmo. O sistema prepara a operação.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#aab6ad]">As preferências orientam pautas e formatos. O plano é distribuído pelo período, respeita o fuso de São Paulo, evita duplicação por idempotência e permanece como rascunho até revisão.</p></div>
        <Switch checked={Boolean(form.enabled)} onCheckedChange={enabled => setForm({ ...form, enabled })} />
      </div>

      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <label className="saas-field"><span>Cadência</span><select value={form.cadence} onChange={e => setForm({ ...form, cadence: e.target.value })}><option value="daily">Todos os dias</option><option value="weekdays">Segunda a sexta</option><option value="custom">Personalizada</option></select></label>
        <label className="saas-field"><span>Publicações por semana</span><input type="number" min={1} max={7} value={form.postsPerWeek} onChange={e => setForm({ ...form, postsPerWeek: e.target.value })} /></label>
        <label className="saas-field"><span>Horário padrão</span><input type="time" value={form.defaultPublishTime} onChange={e => setForm({ ...form, defaultPublishTime: e.target.value })} /></label>
        <label className="saas-field"><span>Horizonte de planejamento</span><select value={form.planningHorizonDays} onChange={e => setForm({ ...form, planningHorizonDays: Number(e.target.value) })}><option value={7}>7 dias</option><option value={15}>15 dias</option><option value={30}>30 dias</option><option value={60}>60 dias</option><option value={90}>90 dias</option></select></label>
        <label className="saas-field md:col-span-2"><span>Áreas prioritárias</span><input value={form.preferredAreas ?? ""} onChange={e => setForm({ ...form, preferredAreas: e.target.value })} placeholder="Trabalhista, Consumidor, Empresarial..." /></label>
        <label className="saas-field md:col-span-2"><span>Formatos preferidos</span><input value={form.preferredFormats ?? ""} onChange={e => setForm({ ...form, preferredFormats: e.target.value })} placeholder="carousel, post, reel" /></label>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="saas-toggle-card"><ShieldCheck className="h-5 w-5 text-[#e3bd7f]" /><div><strong>Aprovação jurídica</strong><small>Sempre obrigatória antes de qualquer publicação</small></div><span className="is-on" aria-label="Aprovação jurídica obrigatória" /></div>
        <button type="button" onClick={() => setForm({ ...form, refreshRadarDaily: !form.refreshRadarDaily })} className="saas-toggle-card"><Radar className="h-5 w-5 text-[#e3bd7f]" /><div><strong>Priorizar Radar</strong><small>{form.refreshRadarDaily ? "Considerar pautas atuais ao atualizar" : "Atualização e pesquisa manuais"}</small></div><span className={form.refreshRadarDaily ? "is-on" : ""} /></button>
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <Button type="submit" disabled={update.isPending} className="saas-button-secondary">
          {update.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Salvar automação
        </Button>
        <select className="editorial-input !w-auto" value={planDays} onChange={e => setPlanDays(Number(e.target.value) as 7 | 15 | 30)}><option value={7}>Planejar 7 dias</option><option value={15}>Planejar 15 dias</option><option value={30}>Planejar 30 dias</option></select>
        <Button type="button" disabled={generateCampaign.isPending} onClick={() => { const start = new Date(); start.setDate(start.getDate() + 1); generateCampaign.mutate({ idempotencyKey: crypto.randomUUID(), days: planDays, startDate: start, postsPerWeek: Number(form.postsPerWeek), defaultPublishTime: form.defaultPublishTime, objective: "Autoridade e atualidade", timezone: "America/Sao_Paulo" }); }} className="saas-button-primary">
          {generateCampaign.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}Gerar plano agora
        </Button>
      </div>
      {planMessage && <div className="mt-4 rounded-xl border border-[#c99550]/20 bg-[#c99550]/[.06] px-4 py-3 text-xs text-[#d9d0c4]">{planMessage} <button type="button" onClick={() => setLocation("/calendario")} className="ml-2 font-semibold text-[#e3bd7f]">Abrir calendário</button></div>}
    </form>

    <aside className="space-y-4">
      {[{ icon: Radar, title: "1. Descobrir", text: "Radar consulta fontes oficiais quando acionado." }, { icon: WandSparkles, title: "2. Produzir", text: "IA prepara pauta, texto e direção visual vinculando a fonte." }, { icon: ShieldCheck, title: "3. Revisar", text: "Compliance e aprovação humana antecedem qualquer envio." }, { icon: CalendarRange, title: "4. Programar", text: "Conteúdo aprovado entra no calendário e na fila de publicação." }, { icon: Clock3, title: "5. Publicar", text: "A integração oficial só envia após conexão, testes e confirmação exigida pelo fluxo." }].map(({ icon: Icon, title, text }) => <div key={title} className="saas-card flex gap-4 p-5"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c99550]/10 text-[#e3bd7f]"><Icon className="h-5 w-5" /></div><div><p className="font-semibold text-[#eee5d7]">{title}</p><p className="mt-1 text-sm leading-5 text-[#98a79d]">{text}</p></div></div>)}
    </aside>
  </div>;
}
