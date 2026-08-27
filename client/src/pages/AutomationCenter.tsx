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
  const generateCampaign = trpc.socialStudio.generateCampaign.useMutation({ onSuccess: async result => { setPlanMessage(`${result.count} conteúdos foram criados como rascunhos com datas-alvo.`); await utils.socialStudio.data.invalidate(); }, onError: error => setPlanMessage(error.message) });
  useEffect(() => setForm(settings ?? form), [settings?.id]);
  const submit = (event: FormEvent) => { event.preventDefault(); update.mutate({ ...form, postsPerWeek: Number(form.postsPerWeek), planningHorizonDays: Number(form.planningHorizonDays), preferredAreas: form.preferredAreas || null, preferredFormats: form.preferredFormats || null }); };

  return <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
    <form onSubmit={submit} className="saas-card p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div><div className="saas-eyebrow"><Bot className="h-3.5 w-3.5" /> Piloto automático</div><h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">Defina o ritmo. O sistema prepara a operação.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Estas preferências persistem no banco e servem como política para planejamento, radar e publicação. A aprovação humana continua ativada por padrão.</p></div>
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
        <button type="button" onClick={() => setForm({ ...form, requireApproval: !form.requireApproval })} className="saas-toggle-card"><ShieldCheck className="h-5 w-5 text-emerald-300" /><div><strong>Aprovação humana</strong><small>{form.requireApproval ? "Obrigatória antes de publicar" : "Desativada"}</small></div><span className={form.requireApproval ? "is-on" : ""} /></button>
        <button type="button" onClick={() => setForm({ ...form, refreshRadarDaily: !form.refreshRadarDaily })} className="saas-toggle-card"><Radar className="h-5 w-5 text-cyan-300" /><div><strong>Radar diário</strong><small>{form.refreshRadarDaily ? "Atualizar pautas automaticamente" : "Atualização manual"}</small></div><span className={form.refreshRadarDaily ? "is-on" : ""} /></button>
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <Button type="submit" disabled={update.isPending} className="saas-button-secondary">
          {update.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Salvar automação
        </Button>
        <select className="editorial-input !w-auto" value={planDays} onChange={e => setPlanDays(Number(e.target.value) as 7 | 15 | 30)}><option value={7}>Planejar 7 dias</option><option value={15}>Planejar 15 dias</option><option value={30}>Planejar 30 dias</option></select>
        <Button type="button" disabled={generateCampaign.isPending} onClick={() => { const start = new Date(); start.setDate(start.getDate() + 1); generateCampaign.mutate({ days: planDays, startDate: start, postsPerWeek: Number(form.postsPerWeek), defaultPublishTime: form.defaultPublishTime, objective: "Autoridade e atualidade" }); }} className="saas-button-primary">
          {generateCampaign.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}Gerar plano agora
        </Button>
      </div>
      {planMessage && <div className="mt-4 rounded-xl border border-violet-400/15 bg-violet-500/[.05] px-4 py-3 text-xs text-slate-300">{planMessage} <button type="button" onClick={() => setLocation("/calendario")} className="ml-2 font-semibold text-violet-300">Abrir calendário</button></div>}
    </form>

    <aside className="space-y-4">
      {[{ icon: Radar, title: "1. Descobrir", text: "Radar busca temas recentes em fontes oficiais." }, { icon: WandSparkles, title: "2. Produzir", text: "IA prepara pauta, texto e direção visual vinculando a fonte." }, { icon: ShieldCheck, title: "3. Revisar", text: "Compliance e aprovação humana antecedem qualquer envio." }, { icon: CalendarRange, title: "4. Programar", text: "Conteúdo aprovado entra no calendário e na fila de publicação." }, { icon: Clock3, title: "5. Publicar", text: "A integração oficial executa no horário e registra falhas ou sucesso." }].map(({ icon: Icon, title, text }) => <div key={title} className="saas-card flex gap-4 p-5"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300"><Icon className="h-5 w-5" /></div><div><p className="font-semibold text-slate-100">{title}</p><p className="mt-1 text-sm leading-5 text-slate-500">{text}</p></div></div>)}
    </aside>
  </div>;
}
