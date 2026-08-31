import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { hasSimilarContent } from "@shared/contentSimilarity";
import { calculatePrePublicationScore } from "@shared/prePublication";
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpenText,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Link as LinkIcon,
  Loader2,
  Plus,
  Sparkles,
  Upload,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { BrandProfile, ContentPost, EditorialTopic, contentSources, knowledgeMaterials } from "../../../drizzle/schema";

const templates = [
  { key: "carrossel_didatico", label: "Carrossel didático", format: "carousel", description: "Capa, contexto, pontos práticos e encerramento." },
  { key: "checklist_preventivo", label: "Checklist preventivo", format: "carousel", description: "Rotina verificável e pontos de atenção." },
  { key: "faq_juridico", label: "FAQ jurídico", format: "post", description: "Dúvida recorrente respondida com cautela." },
  { key: "noticia_comentada", label: "Notícia comentada", format: "post", description: "Fato recente, fonte e impacto prático." },
  { key: "institucional", label: "Institucional", format: "post", description: "Posicionamento e atuação do escritório." },
  { key: "reel_roteiro", label: "Roteiro de Reel", format: "reel", description: "Gancho, fala curta e tela final." },
] as const;

const pillars = ["Educação jurídica", "Autoridade técnica", "Prevenção de riscos", "Institucional", "Conversão responsável"];
const stages = ["discovery", "consideration", "conversion", "relationship"] as const;
const objectives = ["Alcance qualificado", "Autoridade", "Geração de conversa", "Conversão responsável", "Relacionamento", "Retenção"];

type ContentSource = typeof contentSources.$inferSelect;
type KnowledgeMaterial = typeof knowledgeMaterials.$inferSelect;
type FunnelStage = NonNullable<ContentPost["funnelStage"]>;
type DraftForm = {
  topicId: number | null;
  sourceId: number | null;
  area: string;
  topic: string;
  audience: string;
  format: ContentPost["format"];
  objective: string;
  contentPillar: string;
  campaign: string;
  funnelStage: FunnelStage;
  templateKey: string;
  legalSource: string;
};
type EditorState = Omit<ContentPost, "sourceId" | "reviewDueAt" | "mediaUrl" | "strategicObjective" | "contentPillar" | "campaign" | "funnelStage" | "templateKey"> & {
  sourceId: string;
  reviewDueAt: string;
  mediaUrl: string;
  strategicObjective: string;
  contentPillar: string;
  campaign: string;
  funnelStage: FunnelStage;
  templateKey: string;
};
type GenerateDraftInput = Omit<DraftForm, "campaign" | "legalSource"> & { campaign: string | null; legalSource: string | null };
type UpdatePostInput = {
  id: number;
  sourceId: number | null;
  title: string;
  hook: string | null;
  caption: string | null;
  cta: string | null;
  hashtags: string | null;
  keyStatement: string | null;
  legalSource: string | null;
  reviewDueAt: Date | null;
  mediaUrl: string | null;
  strategicObjective: string | null;
  contentPillar: string | null;
  campaign: string | null;
  funnelStage: FunnelStage | null;
  templateKey: string | null;
};
type ContentDeskProps = {
  topics: EditorialTopic[];
  sources: ContentSource[];
  brand: BrandProfile | null;
  posts: ContentPost[];
  selectedPost: ContentPost | null;
  selectedTopicId: number | null;
  onSelectTopic: (id: number) => void;
  onSelectPost: (id: number) => void;
  onGenerate: (value: GenerateDraftInput) => void;
  generating: boolean;
  onUpdate: (value: UpdatePostInput) => void;
  saving: boolean;
  onSendReview: (id: number) => void;
  onDecide: (id: number, decision: "approved" | "rejected" | "changes_requested", notes?: string) => void;
  onSchedule: (id: number, scheduledAt: Date) => void;
};
type KnowledgeLinkInput = Pick<KnowledgeMaterial, "title" | "materialType" | "url" | "notes" | "isVerified">;
type KnowledgeUploadInput = { title: string; materialType: string; mimeType: string; base64: string; notes: string | null; isVerified: boolean };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.13em] text-[#b99a67]">{label}</span>{children}</label>;
}

function localInputValue(value?: Date | string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function dateLabel(value?: Date | string | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "—";
}

function areaCode(area: string) {
  return ({ Consumidor: "CON", Trabalhista: "TRB", "Trabalhista Empresarial": "EMP", Tributário: "TRI", Ambiental: "AMB", Penal: "PEN", "Juizado Especial": "JEC", LGPD: "LGPD", Compliance: "CMP" } as Record<string, string>)[area] ?? "DPT";
}

function statusLabel(status: string) {
  return ({ draft: "Rascunho", review: "Em revisão", approved: "Aprovado", scheduled: "Agendado", published: "Publicado", rejected: "Ajustes" } as Record<string, string>)[status] ?? status;
}

function TemplatePreview({ title, hook, brandName, template }: { title?: string; hook?: string | null; brandName?: string; template: string }) {
  return <div className="rounded-xl border border-[#d5ad6b]/25 bg-[radial-gradient(circle_at_top_right,_rgba(202,153,80,.22),_transparent_36%),linear-gradient(145deg,#18352d,#0b1714_68%)] p-4">
    <div className="flex aspect-[4/5] flex-col justify-between border border-[#d5ad6b]/20 p-4">
      <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#d8af6c]">{template.replace(/_/g, " ")}</p>
      <div>
        <p className="text-[9px] uppercase tracking-[0.16em] text-[#e0bf8b]">S2 Studio</p>
        <h3 className="mt-3 font-serif text-2xl leading-[1.02] text-[#f1e8db]">{title || "Título da publicação"}</h3>
        <p className="mt-3 line-clamp-3 text-[10px] leading-4 text-[#c2cbc3]">{hook || "Gancho informativo e direto, renderizado como texto pela plataforma."}</p>
      </div>
      <div className="flex items-center justify-between border-t border-[#d5ad6b]/20 pt-3"><span className="font-serif text-base text-[#e5bb78]">DT</span><span className="text-[8px] tracking-[0.15em] text-[#9da89f]">{brandName || "Social Studio"}</span></div>
    </div>
    <p className="mt-3 text-[10px] leading-4 text-[#9ba59e]">Prévia segura: os textos são renderizados pelo sistema; mídia externa serve apenas como plano de fundo ou referência.</p>
  </div>;
}

export function ContentDeskV4(props: ContentDeskProps) {
  const { topics, sources, brand, posts, selectedPost, selectedTopicId, onSelectTopic, onSelectPost, onGenerate, generating, onUpdate, saving, onSendReview, onDecide, onSchedule } = props;
  const selectedTopic = topics.find(topic => topic.id === selectedTopicId) ?? topics[0];
  const [form, setForm] = useState<DraftForm>({ topicId: selectedTopic?.id ?? null, sourceId: null, area: selectedTopic?.area ?? "Trabalhista Empresarial", topic: selectedTopic?.title ?? "", audience: selectedTopic?.audience ?? "Empresas e gestores", format: selectedTopic?.suggestedFormat ?? "carousel", objective: "Autoridade", contentPillar: "Educação jurídica", campaign: "", funnelStage: "discovery", templateKey: "carrossel_didatico", legalSource: selectedTopic?.sourceUrl ?? "" });
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [scheduleValue, setScheduleValue] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (selectedTopic) setForm(current => ({ ...current, topicId: selectedTopic.id, area: selectedTopic.area, topic: selectedTopic.title, audience: selectedTopic.audience, format: selectedTopic.suggestedFormat, legalSource: selectedTopic.sourceUrl ?? "" }));
  }, [selectedTopic?.id]);

  useEffect(() => {
    if (selectedPost) {
      setEditor({ ...selectedPost, sourceId: selectedPost.sourceId?.toString() ?? "", reviewDueAt: localInputValue(selectedPost.reviewDueAt), mediaUrl: selectedPost.mediaUrl ?? "", strategicObjective: selectedPost.strategicObjective ?? "Autoridade", contentPillar: selectedPost.contentPillar ?? "Educação jurídica", campaign: selectedPost.campaign ?? "", funnelStage: selectedPost.funnelStage ?? "discovery", templateKey: selectedPost.templateKey ?? "carrossel_didatico" });
      setScheduleValue(localInputValue(selectedPost.scheduledAt));
      setNotes("");
    }
  }, [selectedPost?.id]);

  const selectedTemplate = templates.find((template) => template.key === (editor?.templateKey ?? form.templateKey)) ?? templates[0];
  const preflight = editor ? calculatePrePublicationScore({ ...editor, prohibitedTerms: brand?.prohibitedTerms }) : { score: 0, pending: [] as string[] };
  const similar = useMemo(() => {
    if (!editor) return [];
    const currentTopic = topics.find(topic => topic.id === editor.topicId)?.title ?? "";
    const candidate = `${currentTopic} ${editor.title ?? ""} ${editor.caption ?? ""}`;
    return posts.filter(post => {
      if (post.id === editor.id) return false;
      const postTopic = topics.find(topic => topic.id === post.topicId)?.title ?? "";
      return hasSimilarContent(candidate, `${postTopic} ${post.title ?? ""} ${post.caption ?? ""}`).similar;
    });
  }, [editor?.id, editor?.title, editor?.caption, editor?.topicId, posts, topics]);

  const selectSource = (value: string, target: "form" | "editor") => {
    const source = sources.find(item => item.id === Number(value));
    if (target === "form") setForm({ ...form, sourceId: value ? Number(value) : null, legalSource: source?.url ?? form.legalSource });
    else if (editor) setEditor({ ...editor, sourceId: value || "", legalSource: source?.url ?? editor.legalSource });
  };

  const createDraft = (event: FormEvent) => {
    event.preventDefault();
    onGenerate({ ...form, sourceId: form.sourceId || null, campaign: form.campaign || null, legalSource: form.legalSource || null });
  };

  const save = () => editor && onUpdate({
    id: editor.id,
    sourceId: editor.sourceId ? Number(editor.sourceId) : null,
    title: editor.title,
    hook: editor.hook || null,
    caption: editor.caption || null,
    cta: editor.cta || null,
    hashtags: editor.hashtags || null,
    keyStatement: editor.keyStatement || null,
    legalSource: editor.legalSource || null,
    reviewDueAt: editor.reviewDueAt ? new Date(editor.reviewDueAt) : null,
    mediaUrl: editor.mediaUrl || null,
    strategicObjective: editor.strategicObjective || null,
    contentPillar: editor.contentPillar || null,
    campaign: editor.campaign || null,
    funnelStage: editor.funnelStage || null,
    templateKey: editor.templateKey || null,
  });

  return <div className="grid gap-7 xl:grid-cols-[0.78fr_1.22fr]">
    <div className="space-y-6">
      <section className="editorial-panel rounded-2xl p-5 sm:p-6">
        <p className="tiny-kicker">Estratégia antes da produção</p><h2 className="mt-2 font-serif text-2xl">Crie com direção</h2>
        <form className="mt-6 space-y-4" onSubmit={createDraft}>
          <Field label="Tema da biblioteca"><select className="editorial-input" value={form.topicId ?? ""} onChange={(event) => onSelectTopic(Number(event.target.value))}>{topics.map(topic => <option className="bg-[#12221e]" value={topic.id} key={topic.id}>{topic.area} — {topic.title}</option>)}</select></Field>
          <Field label="Objetivo estratégico"><select className="editorial-input" value={form.objective} onChange={(event) => setForm({ ...form, objective: event.target.value })}>{objectives.map((objective) => <option className="bg-[#12221e]" key={objective}>{objective}</option>)}</select></Field>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Pilar editorial"><select className="editorial-input" value={form.contentPillar} onChange={(event) => setForm({ ...form, contentPillar: event.target.value })}>{pillars.map((item) => <option className="bg-[#12221e]" key={item}>{item}</option>)}</select></Field><Field label="Estágio do funil"><select className="editorial-input" value={form.funnelStage} onChange={(event) => setForm({ ...form, funnelStage: event.target.value as FunnelStage })}>{stages.map((item) => <option className="bg-[#12221e]" key={item} value={item}>{item}</option>)}</select></Field></div>
          <Field label="Campanha"><input className="editorial-input" value={form.campaign} onChange={(event) => setForm({ ...form, campaign: event.target.value })} placeholder="Ex.: Prevenção trabalhista" /></Field>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Modelo"><select className="editorial-input" value={form.templateKey} onChange={(event) => { const template = templates.find((item) => item.key === event.target.value) ?? templates[0]; setForm({ ...form, templateKey: template.key, format: template.format }); }}>{templates.map((item) => <option className="bg-[#12221e]" key={item.key} value={item.key}>{item.label}</option>)}</select></Field><Field label="Público"><input className="editorial-input" value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })} /></Field></div>
          <Field label="Fonte vinculada"><select className="editorial-input" value={form.sourceId ?? ""} onChange={(event) => selectSource(event.target.value, "form")}><option className="bg-[#12221e]" value="">Selecionar fonte da central</option>{sources.map(source => <option className="bg-[#12221e]" value={source.id} key={source.id}>{source.title}</option>)}</select></Field>
          <Button type="submit" disabled={generating} className="w-full bg-[#c99550] text-[#13221f] hover:bg-[#ddb06b]">{generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Gerar rascunho estruturado</Button>
          <p className="text-[10px] leading-4 text-[#8f9d95]">{selectedTemplate.description} O sistema cria rascunho, nunca publica sem revisão humana.</p>
        </form>
      </section>
      <section className="editorial-panel rounded-2xl p-5"><div className="flex items-center justify-between"><p className="tiny-kicker">Fila editorial</p><span className="text-xs text-[#a7b0aa]">{posts.length}</span></div><div className="mt-4 space-y-2">{posts.length === 0 ? <p className="text-xs text-[#9aa59e]">Aguardando primeiro rascunho.</p> : posts.map(post => <button type="button" onClick={() => onSelectPost(post.id)} key={post.id} className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left", selectedPost?.id === post.id ? "border-[#c99550]/45 bg-[#c99550]/8" : "border-white/7 bg-black/10 hover:bg-white/4")}><span className="rounded-full border border-[#c99550]/20 bg-[#c99550]/8 px-2 py-1 font-serif text-[9px] text-[#e1ba78]">{areaCode(post.area)}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[#ede5d9]">{post.title}</p><p className="mt-1 text-[10px] text-[#90a098]">{post.contentPillar ?? "Sem pilar"} · {statusLabel(post.status)}</p></div></button>)}</div></section>
    </div>
    <div>{!editor ? <div className="editorial-panel flex min-h-72 flex-col items-center justify-center rounded-2xl p-8 text-center"><FileText className="h-6 w-6 text-[#c99550]" /><h3 className="mt-4 font-serif text-2xl">Selecione um conteúdo</h3><p className="mt-2 max-w-sm text-xs leading-5 text-[#9eaaa3]">O editor reúne texto, estratégia, rastreabilidade, controles de repetição e preparação para Instagram.</p></div> : <section className="editorial-panel overflow-hidden rounded-2xl"><div className="border-b border-white/8 p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="tiny-kicker">{editor.strategicObjective} · {editor.contentPillar}</p><h2 className="mt-2 font-serif text-2xl">{editor.format === "carousel" ? "Carrossel informativo" : "Conteúdo institucional"}</h2></div><span className="rounded-full bg-[#c99550]/10 px-3 py-1 text-[10px] font-bold text-[#e8c789]">{statusLabel(editor.status)}</span></div></div><div className="grid gap-6 p-5 sm:p-6 2xl:grid-cols-[1.05fr_0.95fr]"><div className="space-y-4"><Field label="Título"><input className="editorial-input font-serif text-lg" value={editor.title} onChange={(event) => setEditor({ ...editor, title: event.target.value })} /></Field><Field label="Gancho"><textarea className="editorial-input min-h-20 resize-y" value={editor.hook ?? ""} onChange={(event) => setEditor({ ...editor, hook: event.target.value })} /></Field><Field label="Legenda pronta"><textarea className="editorial-input min-h-60 resize-y leading-6" value={editor.caption ?? ""} onChange={(event) => setEditor({ ...editor, caption: event.target.value })} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="CTA"><textarea className="editorial-input min-h-20 resize-y" value={editor.cta ?? ""} onChange={(event) => setEditor({ ...editor, cta: event.target.value })} /></Field><Field label="Hashtags"><textarea className="editorial-input min-h-20 resize-y" value={editor.hashtags ?? ""} onChange={(event) => setEditor({ ...editor, hashtags: event.target.value })} /></Field></div><Button onClick={save} disabled={saving} className="bg-[#c99550] text-[#13221f] hover:bg-[#ddb06b]">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Salvar alterações</Button></div><aside className="space-y-4"><div className="rounded-2xl border border-[#c99550]/20 bg-[#0a1613]/70 p-4"><p className="tiny-kicker">Score pré-publicação</p><div className="mt-4 flex items-end justify-between"><p className="font-serif text-5xl text-[#e5bb78]">{preflight.score}</p><p className="mb-2 text-xs text-[#9ba69f]">{preflight.score >= 85 ? "Pronto para revisão" : "Faltam controles"}</p></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full bg-[#c99550]" style={{ width: `${preflight.score}%` }} /></div><p className="mt-3 text-[10px] leading-4 text-[#9da89f]">Pendências: {preflight.pending.length ? preflight.pending.join(", ") : "nenhuma"}.</p></div><TemplatePreview title={editor.title} hook={editor.hook} brandName={brand?.brandName} template={editor.templateKey} />{similar.length > 0 && <div className="rounded-xl border border-amber-300/25 bg-amber-300/8 p-4"><div className="flex gap-2 text-amber-100"><AlertTriangle className="h-4 w-4 shrink-0" /><p className="text-xs font-semibold">Possível repetição detectada</p></div><p className="mt-2 text-[10px] leading-4 text-amber-100/70">Tema, título ou legenda se aproxima de: {similar.map(post => post.title).join(" · ")}</p></div>}<div className="rounded-xl border border-white/7 bg-black/15 p-4"><p className="tiny-kicker">Rastreabilidade</p><div className="mt-4 space-y-4"><Field label="Objetivo estratégico"><select className="editorial-input" value={editor.strategicObjective ?? "Autoridade"} onChange={(event) => setEditor({ ...editor, strategicObjective: event.target.value })}>{objectives.map((objective) => <option className="bg-[#12221e]" key={objective}>{objective}</option>)}</select></Field><Field label="Afirmação-chave"><textarea className="editorial-input min-h-20 resize-y" value={editor.keyStatement ?? ""} onChange={(event) => setEditor({ ...editor, keyStatement: event.target.value })} /></Field><Field label="Fonte da central"><select className="editorial-input" value={editor.sourceId ?? ""} onChange={(event) => selectSource(event.target.value, "editor")}><option className="bg-[#12221e]" value="">Selecionar fonte</option>{sources.map(source => <option className="bg-[#12221e]" value={source.id} key={source.id}>{source.title}</option>)}</select></Field><Field label="Base jurídica ou URL"><input className="editorial-input" value={editor.legalSource ?? ""} onChange={(event) => setEditor({ ...editor, legalSource: event.target.value })} /></Field><Field label="Revisar novamente em"><input type="datetime-local" className="editorial-input" value={editor.reviewDueAt ?? ""} onChange={(event) => setEditor({ ...editor, reviewDueAt: event.target.value })} /></Field><Field label="Link público da mídia"><div className="relative"><LinkIcon className="absolute left-3 top-3 h-4 w-4 text-[#ba955e]" /><input className="editorial-input pl-9" value={editor.mediaUrl ?? ""} onChange={(event) => setEditor({ ...editor, mediaUrl: event.target.value })} placeholder="https://..." /></div></Field></div></div><div className="rounded-xl border border-white/7 bg-black/15 p-4"><p className="tiny-kicker">Decisão humana</p><textarea className="editorial-input mt-3 min-h-20 resize-y text-[11px]" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Observação da revisão" /><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => onSendReview(editor.id)} disabled={(editor.status !== "draft" && editor.status !== "rejected") || similar.length > 0} className="border-[#d9b46f]/35 bg-transparent text-[#e9cf9f]">Enviar à revisão</Button><Button size="sm" onClick={() => onDecide(editor.id, "approved", notes)} disabled={editor.status !== "review"} className="bg-emerald-300/15 text-emerald-100">Aprovar</Button><Button size="sm" onClick={() => onDecide(editor.id, "changes_requested", notes)} disabled={editor.status !== "review"} className="bg-red-300/12 text-red-100">Ajustar</Button></div></div><div className="rounded-xl border border-[#c99550]/15 bg-[#c99550]/5 p-4"><p className="tiny-kicker text-[#e2ba7c]">Agenda interna</p><input type="datetime-local" className="editorial-input mt-3" value={scheduleValue} onChange={(event) => setScheduleValue(event.target.value)} /><Button onClick={() => scheduleValue && onSchedule(editor.id, new Date(scheduleValue))} disabled={editor.status !== "approved" || !scheduleValue} size="sm" className="mt-3 w-full bg-[#c99550]/15 text-[#f3d49f]">Agendar no calendário</Button></div></aside></div></section>}</div>
  </div>;
}

export function StrategyBoardV2({ topics, onUseTopic }: { topics: EditorialTopic[]; onUseTopic: (id: number) => void }) {
  const [days, setDays] = useState<7 | 30>(7);
  const [objective, setObjective] = useState("Autoridade");
  const rows = useMemo(() => Array.from({ length: days }, (_, index) => { const date = new Date(); date.setDate(date.getDate() + index); return { date, topic: topics[index % Math.max(topics.length, 1)], pillar: pillars[index % pillars.length], stage: stages[index % stages.length], template: templates[index % templates.length] }; }), [days, topics]);
  return <div className="space-y-6"><section className="editorial-panel rounded-2xl p-5 sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="tiny-kicker">Motor de estratégia</p><h2 className="mt-2 font-serif text-3xl">Planeje pelo objetivo, não apenas pela data.</h2><p className="mt-2 max-w-2xl text-xs leading-5 text-[#9aa69f]">A pauta distribui objetivo, pilar, funil, formato e modelo antes de entrar na produção.</p></div><div className="flex flex-wrap gap-2"><select className="editorial-input w-48" value={objective} onChange={(event) => setObjective(event.target.value)}>{objectives.map((item) => <option className="bg-[#12221e]" key={item}>{item}</option>)}</select><div className="flex rounded-lg border border-white/10 bg-black/10 p-1"><button onClick={() => setDays(7)} className={cn("rounded-md px-4 py-2 text-[10px] font-bold uppercase tracking-widest", days === 7 ? "bg-[#c99550]/18 text-[#f1cd98]" : "text-[#8f9d95]")}>7 dias</button><button onClick={() => setDays(30)} className={cn("rounded-md px-4 py-2 text-[10px] font-bold uppercase tracking-widest", days === 30 ? "bg-[#c99550]/18 text-[#f1cd98]" : "text-[#8f9d95]")}>30 dias</button></div></div></div></section><section className="editorial-panel overflow-x-auto rounded-2xl"><div className="min-w-[830px]"><div className="grid grid-cols-[90px_1fr_130px_115px_110px_145px] gap-3 border-b border-white/8 bg-black/15 px-4 py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-[#b99a67]"><span>Data</span><span>Tema</span><span>Objetivo</span><span>Pilar</span><span>Formato</span><span>Modelo</span></div><div className="divide-y divide-white/6">{rows.map((row, index) => <button onClick={() => row.topic && onUseTopic(row.topic.id)} key={`${row.date.toISOString()}-${index}`} className="grid w-full grid-cols-[90px_1fr_130px_115px_110px_145px] gap-3 px-4 py-3 text-left hover:bg-white/3"><span className="text-xs text-[#e5bb78]">{dateLabel(row.date)}</span><span className="min-w-0"><strong className="block truncate text-xs text-[#eee6db]">{row.topic?.title ?? "Biblioteca vazia"}</strong><small className="mt-1 block text-[10px] text-[#8f9e96]">{row.topic?.area}</small></span><span className="text-[10px] text-[#d7af6e]">{objective}</span><span className="text-[10px] text-[#a5b0a8]">{row.pillar}</span><span className="text-[10px] text-[#a5b0a8]">{row.template.format}</span><span className="text-[10px] text-[#d7af6e]">{row.template.label}</span></button>)}</div></div></section></div>;
}

export function KnowledgeDeskV2({ materials, onAdd, adding, onUpload, uploading }: { materials: KnowledgeMaterial[]; onAdd: (value: KnowledgeLinkInput) => void; adding: boolean; onUpload: (value: KnowledgeUploadInput) => void; uploading: boolean }) {
  const [linkForm, setLinkForm] = useState({ title: "", materialType: "site institucional", url: "", notes: "", isVerified: false });
  const [file, setFile] = useState<File | null>(null);
  const [fileNotes, setFileNotes] = useState("");
  const [fileVerified, setFileVerified] = useState(false);
  const [fileError, setFileError] = useState("");
  const addLink = (event: FormEvent) => { event.preventDefault(); onAdd({ ...linkForm, url: linkForm.url || null, notes: linkForm.notes || null }); setLinkForm({ title: "", materialType: "site institucional", url: "", notes: "", isVerified: false }); };
  const uploadFile = (event: FormEvent) => { event.preventDefault(); if (!file) return setFileError("Selecione um arquivo antes de armazenar."); if (file.size > 5 * 1024 * 1024) return setFileError("O arquivo deve ter até 5 MB."); const reader = new FileReader(); reader.onload = () => { const content = String(reader.result ?? ""); const base64 = content.includes(",") ? content.split(",")[1] : content; onUpload({ title: file.name, materialType: "documento", mimeType: file.type || "application/octet-stream", base64, notes: fileNotes || null, isVerified: fileVerified }); setFile(null); setFileNotes(""); setFileVerified(false); setFileError(""); }; reader.readAsDataURL(file); };
  return <div className="grid gap-7 xl:grid-cols-[0.72fr_1.28fr]"><div className="space-y-6"><section className="editorial-panel rounded-2xl p-5 sm:p-6"><p className="tiny-kicker">Base do escritório</p><h2 className="mt-2 font-serif text-2xl">Vincular URL</h2><form className="mt-6 space-y-4" onSubmit={addLink}><Field label="Título"><input required className="editorial-input" value={linkForm.title} onChange={(event) => setLinkForm({ ...linkForm, title: event.target.value })} /></Field><Field label="Tipo"><select className="editorial-input" value={linkForm.materialType} onChange={(event) => setLinkForm({ ...linkForm, materialType: event.target.value })}>{["site institucional", "catálogo", "FAQ", "serviço", "imagem de referência"].map((item) => <option className="bg-[#12221e]" key={item}>{item}</option>)}</select></Field><Field label="URL do material"><input type="url" className="editorial-input" value={linkForm.url} onChange={(event) => setLinkForm({ ...linkForm, url: event.target.value })} placeholder="https://..." /></Field><Field label="Observação"><textarea className="editorial-input min-h-20 resize-y" value={linkForm.notes} onChange={(event) => setLinkForm({ ...linkForm, notes: event.target.value })} /></Field><label className="flex items-center gap-2 text-xs text-[#cbd3cd]"><input type="checkbox" checked={linkForm.isVerified} onChange={(event) => setLinkForm({ ...linkForm, isVerified: event.target.checked })} />Material revisado internamente</label><Button type="submit" disabled={adding} className="w-full bg-[#c99550] text-[#13221f] hover:bg-[#ddb06b]">{adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Adicionar referência</Button></form></section><section className="editorial-panel rounded-2xl p-5 sm:p-6"><p className="tiny-kicker">Documento interno</p><h2 className="mt-2 font-serif text-2xl">Armazenar arquivo</h2><p className="mt-2 text-[11px] leading-5 text-[#9da89f]">PDFs e imagens de até 5 MB são guardados com vínculo à marca. Revise o documento antes de marcar como referência.</p><form className="mt-5 space-y-4" onSubmit={uploadFile}><input type="file" accept="application/pdf,image/*,.doc,.docx" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="block w-full text-xs text-[#cdd5cf] file:mr-3 file:rounded-md file:border-0 file:bg-[#c99550]/15 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#e7c580]" /><Field label="Observação"><textarea className="editorial-input min-h-20 resize-y" value={fileNotes} onChange={(event) => setFileNotes(event.target.value)} /></Field><label className="flex items-center gap-2 text-xs text-[#cbd3cd]"><input type="checkbox" checked={fileVerified} onChange={(event) => setFileVerified(event.target.checked)} />Documento revisado internamente</label>{fileError && <p className="text-xs text-red-200">{fileError}</p>}<Button type="submit" disabled={uploading} className="w-full bg-[#173a31] text-[#e7c580] hover:bg-[#214b3f]">{uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Armazenar documento</Button></form></section></div><section className="editorial-panel rounded-2xl p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="tiny-kicker">Conhecimento consultável</p><h2 className="mt-2 font-serif text-2xl">Base institucional</h2></div><ClipboardCheck className="h-5 w-5 text-[#c99550]" /></div><div className="mt-6 space-y-3">{materials.length === 0 ? <p className="text-sm text-[#9da79f]">Nenhum material vinculado.</p> : materials.map((material) => <article key={material.id} className="rounded-xl border border-white/7 bg-black/10 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-[#eee6da]">{material.title}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-[#be9b63]">{material.materialType} · {material.isVerified ? "revisado" : "aguarda revisão"}</p></div>{material.url && <a href={material.url} target="_blank" rel="noreferrer" className="text-xs text-[#e7bd7d]">Abrir <ArrowUpRight className="inline h-3.5 w-3.5" /></a>}</div>{material.notes && <p className="mt-3 text-xs leading-5 text-[#9ca69f]">{material.notes}</p>}</article>)}</div></section></div>;
}
