import { Badge } from "@/components/ui/badge";
import { Facebook, Instagram, Linkedin, LockKeyhole, Network, Video } from "lucide-react";
import InstagramDesk from "./InstagramDesk";
import SocialProfileManager from "./SocialProfileManager";

const networks = [
  { name: "Instagram", icon: Instagram, state: "Validação pendente", detail: "OAuth oficial e publicação bloqueados até credenciais válidas", tone: "text-[#e3bd7f] bg-[#c99550]/10" },
  { name: "Facebook", icon: Facebook, state: "Próxima integração", detail: "Arquitetura preparada para Meta Graph", tone: "text-[#b9c6ac] bg-[#8ca77b]/10" },
  { name: "LinkedIn", icon: Linkedin, state: "Próxima integração", detail: "Página empresarial e conteúdo profissional", tone: "text-[#d8dfd7] bg-[#f5edde]/[.05]" },
  { name: "TikTok", icon: Video, state: "Próxima integração", detail: "Vídeo curto e conteúdo vertical", tone: "text-[#e3bd7f] bg-[#e3bd7f]/10" },
];

export default function NetworkHub() {
  return <div className="space-y-7">
    <section className="saas-hero rounded-3xl p-6 sm:p-8"><div className="saas-eyebrow"><Network className="h-3.5 w-3.5" /> Central de distribuição</div><h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Conecte as contas sem compartilhar senhas.</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Cada rede deve usar OAuth e tokens criptografados. O fluxo Instagram está implementado, porém bloqueado até que as credenciais do aplicativo sejam validadas; os demais conectores aparecem como expansão controlada, sem simular integração inexistente.</p></section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{networks.map(({ name, icon: Icon, state, detail, tone }) => <article key={name} className="saas-card p-5"><div className="flex items-center justify-between"><div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}><Icon className="h-5 w-5" /></div><Badge variant="outline" className="border-white/10 bg-white/[.03] text-[10px] text-slate-400">{state}</Badge></div><h3 className="mt-5 font-semibold text-white">{name}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>{name !== "Instagram" && <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-600"><LockKeyhole className="h-3.5 w-3.5" />Aguardando credenciais/API oficial</div>}</article>)}</section>
    <SocialProfileManager />
    <InstagramDesk />
  </div>;
}
