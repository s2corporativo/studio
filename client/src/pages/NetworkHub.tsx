import { Badge } from "@/components/ui/badge";
import { LockKeyhole, Network, Sparkles } from "lucide-react";
import { SocialNetworkIcon, type SocialNetworkPlatform } from "@/components/SocialNetworkIcon";
import InstagramDesk from "./InstagramDesk";
import SocialProfileManager from "./SocialProfileManager";

const networks = [
  { name: "Instagram", platform: "instagram", state: "Validação pendente", detail: "OAuth oficial e publicação bloqueados até credenciais válidas" },
  { name: "Facebook", platform: "facebook", state: "Próxima integração", detail: "Arquitetura preparada para Meta Graph" },
  { name: "LinkedIn", platform: "linkedin", state: "Próxima integração", detail: "Página empresarial e conteúdo profissional" },
  { name: "TikTok", platform: "tiktok", state: "Próxima integração", detail: "Vídeo curto e conteúdo vertical" },
  { name: "YouTube", platform: "youtube", state: "Próxima integração", detail: "Vídeo, autoridade e conteúdo de longa duração" },
] satisfies Array<{ name: string; platform: SocialNetworkPlatform; state: string; detail: string }>;

export default function NetworkHub() {
  return <div className="studio-social-hub space-y-7">
    <section className="studio-network-hero"><div className="studio-network-hero-copy"><div className="saas-eyebrow"><Network className="h-3.5 w-3.5" /> Central de distribuição</div><h2>Conecte as contas sem compartilhar senhas.</h2><p>Cada rede usa OAuth e tokens criptografados. O Instagram permanece bloqueado até validar as credenciais do aplicativo; os demais conectores aparecem como expansão controlada, sem simular integração inexistente.</p></div><div className="studio-network-orbit" aria-hidden="true">{networks.map(({ platform }) => <SocialNetworkIcon key={platform} platform={platform} />)}</div></section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{networks.map(({ name, platform, state, detail }) => <article key={name} className="studio-social-network-card"><div className="flex items-center justify-between"><SocialNetworkIcon platform={platform} /><Badge variant="outline" className="studio-network-state">{state}</Badge></div><h3>{name}</h3><p>{detail}</p>{platform !== "instagram" ? <div className="studio-network-lock"><LockKeyhole className="h-3.5 w-3.5" />Aguardando credenciais/API oficial</div> : <div className="studio-network-lock is-attention"><Sparkles className="h-3.5 w-3.5" />Validação técnica necessária</div>}</article>)}</section>
    <SocialProfileManager />
    <InstagramDesk />
  </div>;
}
