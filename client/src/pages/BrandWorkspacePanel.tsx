import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Archive, BrainCircuit, Building2, CheckCircle2, Loader2, Plus, Sparkles } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

const emptyForm = {
  key: "",
  name: "",
  segment: "",
  location: "",
  targetAudience: "",
  commercialGoal: "",
  toneOfVoice: "",
  primaryCta: "",
  prohibitedTerms: "",
  visualGuidelines: "",
  websiteUrl: "",
  whatsapp: "",
};

export default function BrandWorkspacePanel() {
  const utils = trpc.useUtils();
  const workspaces = trpc.brandWorkspaces.list.useQuery();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const activeId = selectedId ?? workspaces.data?.find(item => item.isDefault)?.id ?? workspaces.data?.[0]?.id ?? null;
  const selected = useMemo(() => workspaces.data?.find(item => item.id === activeId) ?? null, [activeId, workspaces.data]);
  const learnings = trpc.brandWorkspaces.learnings.useQuery({ brandWorkspaceId: activeId ?? 0 }, { enabled: Boolean(activeId) });

  const create = trpc.brandWorkspaces.create.useMutation({
    onSuccess: async workspace => {
      await workspaces.refetch();
      setSelectedId(workspace.id);
      setForm(emptyForm);
      setShowCreate(false);
      toast.success("Marca criada no Social OS.");
    },
    onError: error => toast.error(error.message),
  });
  const setDefault = trpc.brandWorkspaces.setDefault.useMutation({
    onSuccess: async workspace => {
      await workspaces.refetch();
      setSelectedId(workspace.id);
      toast.success("Marca padrão atualizada.");
    },
    onError: error => toast.error(error.message),
  });
  const archive = trpc.brandWorkspaces.archive.useMutation({
    onSuccess: async () => { await workspaces.refetch(); setSelectedId(null); toast.success("Marca arquivada."); },
    onError: error => toast.error(error.message),
  });
  const learn = trpc.brandWorkspaces.learnPerformance.useMutation({
    onSuccess: async result => {
      if (activeId) await utils.brandWorkspaces.learnings.invalidate({ brandWorkspaceId: activeId });
      toast.success(result.samples ? `${result.samples} amostra(s) analisada(s); ${result.learnings.length} aprendizado(s) atualizado(s).` : result.message ?? "Sem métricas suficientes ainda.");
    },
    onError: error => toast.error(error.message),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    create.mutate({
      key: form.key,
      name: form.name,
      segment: form.segment || null,
      location: form.location || null,
      targetAudience: form.targetAudience || null,
      commercialGoal: form.commercialGoal || null,
      toneOfVoice: form.toneOfVoice || null,
      primaryCta: form.primaryCta || null,
      prohibitedTerms: form.prohibitedTerms || null,
      visualGuidelines: form.visualGuidelines || null,
      websiteUrl: form.websiteUrl || null,
      whatsapp: form.whatsapp || null,
    });
  }

  if (workspaces.isLoading) return <div className="studio-loading-panel flex min-h-[420px] items-center justify-center"><Loader2 className="studio-loader h-6 w-6 text-[#c59b5a]" /></div>;
  if (workspaces.isError) return <div className="saas-card p-6 text-sm text-rose-300">{workspaces.error.message}</div>;

  return <div className="space-y-6">
    <section className="saas-hero rounded-3xl p-6 sm:p-8">
      <div className="saas-eyebrow"><Building2 className="h-3.5 w-3.5" /> Central de Marcas</div>
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><h1 className="text-3xl font-semibold tracking-tight text-white">Uma operação, múltiplas marcas, memórias separadas.</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Cada workspace mantém posicionamento, público, regras visuais, histórico e aprendizado de performance próprios. A marca padrão é usada quando uma automação não recebe contexto explícito.</p></div>
        <Button onClick={() => setShowCreate(value => !value)} className="saas-button-primary"><Plus className="mr-2 h-4 w-4" />Nova marca</Button>
      </div>
    </section>

    {showCreate && <form onSubmit={submit} className="saas-card p-5 sm:p-6">
      <p className="saas-section-label">Novo workspace</p><h2 className="mt-2 text-xl font-semibold text-white">Cadastrar marca</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Identificador"><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="editorial-input" placeholder="ex: de-paula-teixeira" value={form.key} onChange={e => setForm({ ...form, key: e.target.value.toLowerCase() })} /></Field>
        <Field label="Nome"><input required className="editorial-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Segmento"><input className="editorial-input" value={form.segment} onChange={e => setForm({ ...form, segment: e.target.value })} /></Field>
        <Field label="Localização"><input className="editorial-input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></Field>
        <Field label="Público-alvo"><textarea className="editorial-input min-h-24 resize-y" value={form.targetAudience} onChange={e => setForm({ ...form, targetAudience: e.target.value })} /></Field>
        <Field label="Objetivo comercial"><textarea className="editorial-input min-h-24 resize-y" value={form.commercialGoal} onChange={e => setForm({ ...form, commercialGoal: e.target.value })} /></Field>
        <Field label="Tom de voz"><textarea className="editorial-input min-h-24 resize-y" value={form.toneOfVoice} onChange={e => setForm({ ...form, toneOfVoice: e.target.value })} /></Field>
        <Field label="Diretrizes visuais"><textarea className="editorial-input min-h-24 resize-y" value={form.visualGuidelines} onChange={e => setForm({ ...form, visualGuidelines: e.target.value })} /></Field>
        <Field label="CTA aprovado"><textarea className="editorial-input min-h-20 resize-y" value={form.primaryCta} onChange={e => setForm({ ...form, primaryCta: e.target.value })} /></Field>
        <Field label="Claims/termos proibidos"><textarea className="editorial-input min-h-20 resize-y" value={form.prohibitedTerms} onChange={e => setForm({ ...form, prohibitedTerms: e.target.value })} /></Field>
        <Field label="Website"><input type="url" className="editorial-input" value={form.websiteUrl} onChange={e => setForm({ ...form, websiteUrl: e.target.value })} /></Field>
        <Field label="WhatsApp"><input className="editorial-input" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} /></Field>
      </div>
      <Button type="submit" disabled={create.isPending} className="saas-button-primary mt-5">{create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Criar workspace</Button>
    </form>}

    <div className="grid gap-6 xl:grid-cols-[.72fr_1.28fr]">
      <section className="saas-card p-5 sm:p-6"><p className="saas-section-label">Workspaces</p><div className="mt-4 space-y-2">{(workspaces.data ?? []).map(item => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`w-full rounded-2xl border p-4 text-left transition ${activeId === item.id ? "border-[#c99550]/35 bg-[#c99550]/10" : "border-white/[.06] bg-white/[.02] hover:bg-white/[.04]"}`}><div className="flex items-center justify-between gap-3"><div><p className="font-medium text-slate-200">{item.name}</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-slate-500">{item.segment ?? "segmento não definido"} · {item.status}</p></div>{item.isDefault && <span className="rounded-full border border-[#c99550]/30 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#e2ba7c]">padrão</span>}</div></button>)}{!workspaces.data?.length && <p className="text-sm text-slate-500">Nenhuma marca ativa.</p>}</div></section>

      <section className="saas-card p-5 sm:p-6">{selected ? <><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="saas-section-label">Marca selecionada</p><h2 className="mt-2 text-2xl font-semibold text-white">{selected.name}</h2><p className="mt-2 text-sm text-slate-500">{selected.targetAudience ?? "Público ainda não definido."}</p></div><div className="flex flex-wrap gap-2">{!selected.isDefault && <Button variant="outline" onClick={() => setDefault.mutate({ id: selected.id })} disabled={setDefault.isPending}>Definir padrão</Button>}{!selected.isDefault && <Button variant="ghost" onClick={() => archive.mutate({ id: selected.id })} disabled={archive.isPending}><Archive className="mr-2 h-4 w-4" />Arquivar</Button>}</div></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2"><Info label="Objetivo" value={selected.commercialGoal} /><Info label="Tom" value={selected.toneOfVoice} /><Info label="CTA" value={selected.primaryCta} /><Info label="Diretrizes visuais" value={selected.visualGuidelines} /></div>
        <div className="mt-6 border-t border-white/[.06] pt-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="flex items-center gap-2 text-sm font-semibold text-slate-200"><BrainCircuit className="h-4 w-4 text-[#e2ba7c]" />Memória de performance</p><p className="mt-1 text-xs leading-5 text-slate-500">Usa o snapshot cumulativo mais recente por post/rede, compara apenas com o baseline interno e não atribui causalidade.</p></div><Button className="saas-button-secondary" disabled={learn.isPending} onClick={() => learn.mutate({ brandWorkspaceId: selected.id })}>{learn.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Aprender com métricas</Button></div>
          <div className="mt-4 space-y-2">{(learnings.data ?? []).slice(0, 10).map(item => <article key={item.id} className="rounded-xl border border-white/[.06] bg-white/[.02] p-3"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-wider text-[#e2ba7c]">{item.dimension} · {item.key}</p><span className="text-xs text-slate-500">{item.sampleSize} amostras · {item.confidenceScore}% confiança</span></div><p className="mt-2 text-xs leading-5 text-slate-400">{item.recommendation}</p></article>)}{!learnings.data?.length && <p className="mt-4 text-sm text-slate-500">Ainda não há aprendizado persistido para esta marca.</p>}</div>
        </div></> : <div className="py-12 text-center text-sm text-slate-500">Selecione uma marca.</div>}</section>
    </div>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">{label}</span>{children}</label>;
}

function Info({ label, value }: { label: string; value: string | null }) {
  return <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-3"><p className="text-[9px] font-bold uppercase tracking-[.14em] text-slate-600">{label}</p><p className="mt-1 text-xs leading-5 text-slate-400">{value || "Não definido"}</p></div>;
}
