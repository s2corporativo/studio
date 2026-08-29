import { Button } from "@/components/ui/button";
import { ArrowUpRight, FileUp, Link2, Loader2, Plus, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import type { knowledgeMaterials } from "../../../drizzle/schema";

type KnowledgeMaterial = typeof knowledgeMaterials.$inferSelect;
type KnowledgeLinkInput = Pick<KnowledgeMaterial, "title" | "materialType" | "url" | "notes" | "isVerified">;
type KnowledgeUploadInput = { title: string; materialType: string; mimeType: string; base64: string; notes: string | null; isVerified: boolean };
type KnowledgePanelProps = {
  materials: KnowledgeMaterial[];
  onAdd: (value: KnowledgeLinkInput) => void;
  adding: boolean;
  onUpload: (value: KnowledgeUploadInput) => void;
  uploading: boolean;
};

function inferMime(file: File) {
  if (file.type) return file.type;
  const name = file.name.toLocaleLowerCase("pt-BR");
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (name.endsWith(".doc")) return "application/msword";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

export default function KnowledgePanel({ materials, onAdd, adding, onUpload, uploading }: KnowledgePanelProps) {
  const [link, setLink] = useState({ title: "", materialType: "site institucional", url: "", notes: "", isVerified: false });
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function submitLink(event: FormEvent) {
    event.preventDefault();
    onAdd({ title: link.title, materialType: link.materialType, url: link.url || null, notes: link.notes || null, isVerified: link.isVerified });
    setLink({ title: "", materialType: "site institucional", url: "", notes: "", isVerified: false });
  }

  function submitFile(event: FormEvent) {
    event.preventDefault();
    if (!file) return setMessage("Selecione um arquivo.");
    if (file.size > 5 * 1024 * 1024) return setMessage("O arquivo deve ter até 5 MB.");
    const mimeType = inferMime(file);
    if (mimeType === "application/octet-stream") return setMessage("Formato não reconhecido. Use PDF, DOC, DOCX, JPEG, PNG ou WEBP.");
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result ?? "");
      onUpload({ title: file.name, materialType: "documento", mimeType, base64: raw.includes(",") ? raw.split(",")[1] : raw, notes: notes || null, isVerified: verified });
      setFile(null);
      setNotes("");
      setVerified(false);
      setMessage(null);
    };
    reader.onerror = () => setMessage("Não foi possível ler o arquivo.");
    reader.readAsDataURL(file);
  }

  return <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
    <div className="space-y-5">
      <form onSubmit={submitLink} className="saas-card p-5 sm:p-6">
        <div className="saas-eyebrow"><Link2 className="h-3.5 w-3.5" /> Fonte institucional</div>
        <h2 className="mt-3 text-xl font-semibold text-white">Adicionar referência</h2>
        <div className="mt-5 space-y-3">
          <input required className="editorial-input" placeholder="Título" value={link.title} onChange={event => setLink({ ...link, title: event.target.value })} />
          <select className="editorial-input" value={link.materialType} onChange={event => setLink({ ...link, materialType: event.target.value })}><option>site institucional</option><option>legislação</option><option>jurisprudência</option><option>FAQ</option><option>serviço</option></select>
          <input type="url" className="editorial-input" placeholder="https://..." value={link.url} onChange={event => setLink({ ...link, url: event.target.value })} />
          <textarea className="editorial-input min-h-20 resize-y" placeholder="Observação" value={link.notes} onChange={event => setLink({ ...link, notes: event.target.value })} />
          <label className="flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" checked={link.isVerified} onChange={event => setLink({ ...link, isVerified: event.target.checked })} />Revisado internamente</label>
          <Button type="submit" disabled={adding} className="saas-button-primary w-full">{adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Adicionar</Button>
        </div>
      </form>

      <form onSubmit={submitFile} className="saas-card p-5 sm:p-6">
        <div className="saas-eyebrow"><FileUp className="h-3.5 w-3.5" /> Documento privado</div>
        <h2 className="mt-3 text-xl font-semibold text-white">Armazenar conhecimento</h2>
        <p className="mt-2 text-xs leading-5 text-slate-500">O backend valida a assinatura real do arquivo. Materiais na pasta de conhecimento exigem sessão do usuário.</p>
        <div className="mt-5 space-y-3">
          <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp,.doc,.docx" onChange={event => setFile(event.target.files?.[0] ?? null)} className="block w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-[#c99550]/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#e2ba7c]" />
          <textarea className="editorial-input min-h-20 resize-y" placeholder="Observação" value={notes} onChange={event => setNotes(event.target.value)} />
          <label className="flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" checked={verified} onChange={event => setVerified(event.target.checked)} />Documento revisado internamente</label>
          {message && <p className="text-xs text-amber-300">{message}</p>}
          <Button type="submit" disabled={uploading} variant="outline" className="saas-button-secondary w-full">{uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}Enviar documento</Button>
        </div>
      </form>
    </div>

    <section className="saas-card p-5 sm:p-6">
      <div className="flex items-center justify-between"><div><p className="saas-section-label">Base institucional</p><h2 className="mt-2 text-2xl font-semibold text-white">Conhecimento cadastrado</h2></div><ShieldCheck className="h-5 w-5 text-emerald-300" /></div>
      <div className="mt-6 space-y-3">{materials.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">Nenhum material cadastrado.</p> : materials.map(material => <article key={material.id} className="rounded-2xl border border-white/[.06] bg-white/[.02] p-4"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-slate-200">{material.title}</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-[#e2ba7c]">{material.materialType} · {material.isVerified ? "revisado" : "aguarda revisão"}</p></div>{material.url && <a href={material.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white">Abrir <ArrowUpRight className="h-3.5 w-3.5" /></a>}</div>{material.notes && <p className="mt-3 text-xs leading-5 text-slate-500">{material.notes}</p>}</article>)}</div>
    </section>
  </div>;
}
