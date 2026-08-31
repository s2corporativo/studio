import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Bot, CheckCircle2, Loader2, Play, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const autonomyLevels = ["manual", "assisted", "semi_automatic", "autopilot"] as const;
type AutonomyLevel = typeof autonomyLevels[number];
type AutopilotForm = { level: AutonomyLevel; allowAutoResearch: boolean; allowAutoDraft: boolean; allowAutoSchedule: boolean };

export default function AutopilotPanel() {
  const utils = trpc.useUtils();
  const profile = trpc.socialAutomation.profile.useQuery();
  const executions = trpc.socialAutomation.executions.useQuery();
  const [form, setForm] = useState<AutopilotForm>({ level: "assisted", allowAutoResearch: true, allowAutoDraft: false, allowAutoSchedule: false });

  useEffect(() => {
    if (profile.data) setForm({
      level: profile.data.level,
      allowAutoResearch: profile.data.allowAutoResearch,
      allowAutoDraft: profile.data.allowAutoDraft,
      allowAutoSchedule: profile.data.allowAutoSchedule,
    });
  }, [profile.data?.id, profile.data?.updatedAt]);

  const refresh = async () => Promise.all([utils.socialAutomation.profile.invalidate(), utils.socialAutomation.executions.invalidate()]);
  const update = trpc.socialAutomation.updateProfile.useMutation({ onSuccess: async () => { await refresh(); toast.success("Perfil de autonomia atualizado."); }, onError: error => toast.error(error.message) });
  const scan = trpc.socialAutomation.scan.useMutation({ onSuccess: async result => { await utils.socialAutomation.executions.invalidate(); toast.success(`${result.queued} execução(ões) nova(s) adicionada(s) à fila.`); }, onError: error => toast.error(error.message) });
  const approve = trpc.socialAutomation.approveExecution.useMutation({ onSuccess: async () => { await utils.socialAutomation.executions.invalidate(); toast.success("Execução aprovada e processada."); }, onError: error => toast.error(error.message) });
  const execute = trpc.socialAutomation.executeQueued.useMutation({ onSuccess: async () => { await utils.socialAutomation.executions.invalidate(); toast.success("Execução processada."); }, onError: error => toast.error(error.message) });

  const rows = executions.data ?? [];
  return <div className="space-y-5">
    <Card className="border-[#daba7d]/10 bg-[#10201b] text-[#f3ebdd]">
      <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Bot className="h-5 w-5 text-[#e2ba7c]" />Autopilot seguro</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="saas-field"><span>Nível de autonomia</span><select value={form.level} onChange={e => setForm({ ...form, level: e.target.value as AutonomyLevel })}>{autonomyLevels.map(level => <option key={level} value={level}>{level === "manual" ? "Manual" : level === "assisted" ? "Assistido" : level === "semi_automatic" ? "Semiautomático" : "Autopilot"}</option>)}</select></label>
          <Toggle label="Pesquisa automática" checked={form.allowAutoResearch} onChange={value => setForm({ ...form, allowAutoResearch: value })} />
          <Toggle label="Rascunhos automáticos" checked={form.allowAutoDraft} onChange={value => setForm({ ...form, allowAutoDraft: value })} />
          <Toggle label="Agendamento automático" checked={form.allowAutoSchedule} onChange={value => setForm({ ...form, allowAutoSchedule: value })} />
        </div>
        <div className="rounded-xl border border-amber-300/20 bg-amber-300/[.05] p-4 text-xs leading-5 text-amber-100/90"><ShieldCheck className="mr-2 inline h-4 w-4" />Conteúdo jurídico e publicação externa continuam exigindo aprovação humana em todos os níveis. O Autopilot não publica anúncios nem movimenta orçamento.</div>
        <div className="flex flex-wrap gap-3">
          <Button disabled={update.isPending} onClick={() => update.mutate(form)} className="saas-button-secondary">{update.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Salvar autonomia</Button>
          <Button disabled={scan.isPending || form.level === "manual"} onClick={() => scan.mutate()} className="saas-button-primary">{scan.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Varrer regras agora</Button>
        </div>
      </CardContent>
    </Card>

    <Card className="border-[#daba7d]/10 bg-[#10201b] text-[#f3ebdd]">
      <CardHeader><CardTitle className="text-lg">Fila auditável</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {rows.slice(0, 30).map(row => <div key={row.id} className="rounded-xl border border-white/[.06] bg-white/[.02] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold">{row.entityType} #{row.entityId}</p><p className="mt-1 text-xs text-[#8f9c93]">Regra #{row.ruleId} · {new Date(row.createdAt).toLocaleString("pt-BR")}</p></div><Badge variant="outline" className="border-white/10">{row.status}</Badge></div>
          {row.errorMessage && <p className="mt-2 text-xs text-rose-300">{row.errorMessage}</p>}
          <div className="mt-3 flex gap-2">{row.status === "pending_approval" && <Button size="sm" onClick={() => approve.mutate({ id: row.id })} disabled={approve.isPending}>Aprovar e executar</Button>}{row.status === "queued" && <Button size="sm" variant="outline" onClick={() => execute.mutate({ id: row.id })} disabled={execute.isPending}><Play className="mr-1 h-3.5 w-3.5" />Executar</Button>}</div>
        </div>)}
        {!rows.length && <p className="text-sm text-[#8f9c93]">Nenhuma execução na fila.</p>}
      </CardContent>
    </Card>
  </div>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <button type="button" onClick={() => onChange(!checked)} className="saas-card flex min-h-20 items-center justify-between gap-3 p-4 text-left"><span className="text-sm text-[#eee5d7]">{label}</span><span className={`h-5 w-9 rounded-full p-0.5 transition ${checked ? "bg-[#c99550]" : "bg-white/10"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-4" : ""}`} /></span></button>;
}
