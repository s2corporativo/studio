import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { instagramOAuthCardState } from "@shared/instagramProfileConnection";
import { CheckCircle2, ExternalLink, Link2, Loader2, Pencil, Plus, Power, Save, Trash2, X } from "lucide-react";
import React, { FormEvent, useMemo, useState } from "react";

type Network = "instagram" | "facebook" | "linkedin" | "tiktok" | "youtube";
type State = "active" | "inactive";
type SocialProfile = {
  id: number;
  network: Network;
  displayName: string;
  handle: string | null;
  profileUrl: string;
  externalAccountId: string | null;
  notes: string | null;
  state: "active" | "inactive" | "pending_oauth" | "connected" | "error";
};

const networkOptions: Array<{ value: Network; label: string; prefix: string }> = [
  { value: "instagram", label: "Instagram", prefix: "@" },
  { value: "facebook", label: "Facebook", prefix: "" },
  { value: "linkedin", label: "LinkedIn", prefix: "" },
  { value: "tiktok", label: "TikTok", prefix: "@" },
  { value: "youtube", label: "YouTube", prefix: "" },
];

type ProfileDraft = {
  network: Network;
  displayName: string;
  handle: string;
  profileUrl: string;
  externalAccountId: string;
  notes: string;
};

const emptyDraft: ProfileDraft = { network: "instagram", displayName: "", handle: "", profileUrl: "", externalAccountId: "", notes: "" };

function networkLabel(network: string) {
  return networkOptions.find(option => option.value === network)?.label ?? network;
}

export default function SocialProfileManager() {
  const utils = trpc.useUtils();
  const profilesQuery = trpc.socialStudio.socialProfiles.useQuery();
  const instagramDataQuery = trpc.socialStudio.instagramData.useQuery(undefined, { refetchOnWindowFocus: false });
  const [draft, setDraft] = useState<ProfileDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const profiles: SocialProfile[] = profilesQuery.data ?? [];

  const addProfile = trpc.socialStudio.addSocialProfile.useMutation({
    onSuccess: async () => {
      await utils.socialStudio.socialProfiles.invalidate();
      await utils.socialStudio.data.invalidate();
      setDraft(emptyDraft);
      setIsFormOpen(false);
      setNotice("Perfil externo adicionado. Nenhuma senha ou token foi armazenado.");
    },
    onError: (error: { message: string }) => setNotice(error.message),
  });

  const updateProfile = trpc.socialStudio.updateSocialProfile.useMutation({
    onSuccess: async () => {
      await utils.socialStudio.socialProfiles.invalidate();
      await utils.socialStudio.data.invalidate();
      setDraft(emptyDraft);
      setEditingId(null);
      setIsFormOpen(false);
      setNotice("Perfil externo atualizado.");
    },
    onError: (error: { message: string }) => setNotice(error.message),
  });

  const removeProfile = trpc.socialStudio.removeSocialProfile.useMutation({
    onSuccess: async () => {
      await utils.socialStudio.socialProfiles.invalidate();
      await utils.socialStudio.data.invalidate();
      setNotice("Perfil removido da central. Isso não altera a conta na rede social.");
    },
    onError: (error: { message: string }) => setNotice(error.message),
  });

  const beginInstagramConnection = trpc.socialStudio.beginInstagramConnection.useMutation({
    onSuccess: ({ authorizationUrl }) => window.location.assign(authorizationUrl),
    onError: (error: { message: string }) => setNotice(error.message),
  });

  const activeCount = useMemo(() => profiles.filter(profile => profile.state === "active" || profile.state === "connected").length, [profiles]);
  const isSaving = addProfile.isPending || updateProfile.isPending;

  function openCreate() {
    setDraft(emptyDraft);
    setEditingId(null);
    setNotice(null);
    setIsFormOpen(true);
  }

  function openEdit(profile: SocialProfile) {
    setDraft({
      network: profile.network as Network,
      displayName: profile.displayName,
      handle: profile.handle ?? "",
      profileUrl: profile.profileUrl,
      externalAccountId: profile.externalAccountId ?? "",
      notes: profile.notes ?? "",
    });
    setEditingId(profile.id);
    setNotice(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setDraft(emptyDraft);
    setEditingId(null);
    setIsFormOpen(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = {
      network: draft.network,
      displayName: draft.displayName.trim(),
      handle: draft.handle.trim() || null,
      profileUrl: draft.profileUrl.trim(),
      externalAccountId: draft.externalAccountId.trim() || null,
      notes: draft.notes.trim() || null,
    };
    if (editingId) {
      const { network: _network, ...editableValues } = values;
      updateProfile.mutate({ id: editingId, ...editableValues, state: profiles.find(profile => profile.id === editingId)?.state === "inactive" ? "inactive" : "active" });
    } else {
      addProfile.mutate(values);
    }
  }

  function toggleState(profile: SocialProfile) {
    const state: State = profile.state === "active" || profile.state === "connected" ? "inactive" : "active";
    updateProfile.mutate({
      id: profile.id,
      displayName: profile.displayName,
      handle: profile.handle,
      profileUrl: profile.profileUrl,
      externalAccountId: profile.externalAccountId,
      notes: profile.notes,
      state,
    });
  }

  function connectInstagramProfile(profileId: number) {
    beginInstagramConnection.mutate({ profileId });
  }

  return <section className="saas-card overflow-hidden">
    <div className="border-b border-[#c99550]/20 bg-[linear-gradient(120deg,rgba(21,58,43,.88),rgba(9,25,19,.5))] px-5 py-6 sm:px-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <div className="saas-eyebrow"><Link2 className="h-3.5 w-3.5" /> Perfis externos</div>
          <h3 className="mt-3 font-serif text-2xl text-[#f5edde] sm:text-3xl">Referências públicas sob seu controle.</h3>
          <p className="mt-2 text-sm leading-6 text-[#d8dfd7]/70">Cadastre os canais que pertencem ao escritório para manter a distribuição organizada. Este cadastro armazena apenas dados públicos de referência — nunca senha, token ou código de verificação.</p>
        </div>
        <Button onClick={openCreate} className="saas-button-primary shrink-0"><Plus className="mr-2 h-4 w-4" /> Adicionar perfil</Button>
      </div>
      <div className="mt-6 flex items-center gap-3 text-xs text-[#d8dfd7]/70"><span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#c99550]/30 bg-[#c99550]/10 text-[#e3bd7f]"><CheckCircle2 className="h-4 w-4" /></span><span><strong className="font-semibold text-[#f5edde]">{activeCount}</strong> perfil(is) ativo(s) de {profiles.length} cadastrado(s)</span></div>
    </div>

    <div className="p-5 sm:p-7">
      {notice && <div role="status" className="mb-5 flex items-start gap-3 border border-[#c99550]/25 bg-[#c99550]/[.08] px-4 py-3 text-xs leading-5 text-[#f5edde]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#e3bd7f]" />{notice}</div>}

      {isFormOpen && <form onSubmit={submit} className="mb-7 border border-[#c99550]/25 bg-[#07150f]/50 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#e3bd7f]">{editingId ? "Editar perfil" : "Novo perfil externo"}</p><p className="mt-1 text-xs text-[#d8dfd7]/65">Informações de referência para a equipe; conexão oficial requer OAuth próprio.</p></div><button type="button" onClick={closeForm} className="text-[#d8dfd7]/50 hover:text-[#f5edde]" aria-label="Fechar formulário"><X className="h-4 w-4" /></button></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-2 text-xs font-medium text-[#d8dfd7]"><span>Rede social</span><select value={draft.network} onChange={event => setDraft(current => ({ ...current, network: event.target.value as Network }))} disabled={Boolean(editingId)} className="editorial-input w-full disabled:cursor-not-allowed disabled:opacity-60">{networkOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="space-y-2 text-xs font-medium text-[#d8dfd7]"><span>Nome de exibição</span><Input required maxLength={160} value={draft.displayName} onChange={event => setDraft(current => ({ ...current, displayName: event.target.value }))} placeholder="Ex.: S2 Studio" className="editorial-input" /></label>
          <label className="space-y-2 text-xs font-medium text-[#d8dfd7]"><span>Identificador público</span><Input maxLength={160} value={draft.handle} onChange={event => setDraft(current => ({ ...current, handle: event.target.value }))} placeholder={`${networkOptions.find(option => option.value === draft.network)?.prefix ?? ""}perfil`} className="editorial-input" /></label>
          <label className="space-y-2 text-xs font-medium text-[#d8dfd7] md:col-span-2"><span>URL pública do perfil</span><Input required type="url" value={draft.profileUrl} onChange={event => setDraft(current => ({ ...current, profileUrl: event.target.value }))} placeholder="https://..." className="editorial-input" /></label>
          <label className="space-y-2 text-xs font-medium text-[#d8dfd7]"><span>ID externo opcional</span><Input maxLength={160} value={draft.externalAccountId} onChange={event => setDraft(current => ({ ...current, externalAccountId: event.target.value }))} placeholder="ID fornecido pela plataforma" className="editorial-input" /></label>
          <label className="space-y-2 text-xs font-medium text-[#d8dfd7] md:col-span-2 xl:col-span-3"><span>Observação interna</span><Textarea maxLength={2000} value={draft.notes} onChange={event => setDraft(current => ({ ...current, notes: event.target.value }))} placeholder="Ex.: canal institucional principal; aguarda OAuth oficial." className="editorial-input min-h-20" /></label>
        </div>
        <div className="mt-5 flex flex-wrap gap-3"><Button type="submit" disabled={isSaving} className="saas-button-primary"><Save className="mr-2 h-4 w-4" />{isSaving ? "Salvando..." : editingId ? "Salvar alterações" : "Cadastrar perfil"}</Button><Button type="button" variant="outline" onClick={closeForm} className="saas-button-secondary">Cancelar</Button></div>
      </form>}

      {profilesQuery.isLoading ? <p className="py-8 text-sm text-[#d8dfd7]/65">Carregando perfis cadastrados...</p> : profiles.length === 0 ? <div className="border border-dashed border-[#c99550]/30 px-6 py-10 text-center"><Link2 className="mx-auto h-6 w-6 text-[#e3bd7f]" /><p className="mt-4 font-serif text-xl text-[#f5edde]">Nenhum perfil externo cadastrado.</p><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#d8dfd7]/65">Adicione o Instagram, LinkedIn, Facebook, TikTok ou YouTube oficial. Os dados ficam separados por usuário e podem ser desativados a qualquer momento.</p><Button onClick={openCreate} className="saas-button-primary mt-5"><Plus className="mr-2 h-4 w-4" /> Cadastrar primeiro perfil</Button></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{profiles.map(profile => {
        const isActive = profile.state === "active" || profile.state === "connected";
        const instagramConnection = instagramDataQuery.data?.connection;
        const oauthState = profile.network === "instagram" ? instagramOAuthCardState(profile.id, instagramConnection) : null;
        return <article key={profile.id} className="border border-[#c99550]/20 bg-[#07150f]/45 p-5">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#e3bd7f]">{networkLabel(profile.network)}</p><h4 className="mt-2 text-base font-semibold text-[#f5edde]">{profile.displayName}</h4>{profile.handle && <p className="mt-1 text-xs text-[#d8dfd7]/65">@{profile.handle}</p>}</div><Badge variant="outline" className={isActive ? "border-[#c99550]/35 bg-[#c99550]/10 text-[#f2d39a]" : "border-white/10 bg-white/[.03] text-slate-400"}>{isActive ? "Ativo" : "Pausado"}</Badge></div>
          {profile.network === "instagram" && <p className={`mt-3 text-[11px] ${oauthState?.linked ? "text-[#e3bd7f]" : "text-[#d8dfd7]/50"}`}>{oauthState?.label}</p>}
          <a href={profile.profileUrl} target="_blank" rel="noreferrer" className="mt-5 flex items-center gap-2 break-all text-xs text-[#d8dfd7]/70 hover:text-[#f2d39a]"><ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#e3bd7f]" />{profile.profileUrl}</a>
          {profile.notes && <p className="mt-4 border-t border-white/[.07] pt-4 text-xs leading-5 text-[#d8dfd7]/55">{profile.notes}</p>}
          <div className="mt-5 flex flex-wrap gap-2">{profile.network === "instagram" && <Button size="sm" variant="outline" onClick={() => connectInstagramProfile(profile.id)} disabled={beginInstagramConnection.isPending || profile.state === "inactive"} className="saas-button-secondary h-8 px-3 text-xs">{beginInstagramConnection.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Link2 className="mr-1.5 h-3.5 w-3.5" />}{oauthState?.linked ? "Refazer OAuth" : "Conectar por OAuth"}</Button>}<Button size="sm" variant="outline" onClick={() => openEdit(profile)} className="saas-button-secondary h-8 px-3 text-xs"><Pencil className="mr-1.5 h-3.5 w-3.5" />Editar</Button><Button size="sm" variant="outline" onClick={() => toggleState(profile)} className="saas-button-secondary h-8 px-3 text-xs"><Power className="mr-1.5 h-3.5 w-3.5" />{isActive ? "Pausar" : "Ativar"}</Button><Button size="sm" variant="outline" onClick={() => { if (window.confirm(`Remover ${profile.displayName} da central? A conta não será alterada na rede social.`)) removeProfile.mutate({ id: profile.id }); }} disabled={removeProfile.isPending} className="h-8 border-red-400/20 px-3 text-xs text-red-200 hover:bg-red-500/10 hover:text-red-100"><Trash2 className="mr-1.5 h-3.5 w-3.5" />Remover</Button></div>
        </article>;
      })}</div>}
    </div>
  </section>;
}
