import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Facebook, Instagram, Linkedin, LockKeyhole, MapPin, Megaphone, Network, Search, ShieldCheck, Video, Youtube } from "lucide-react";
import FacebookPagesPanel from "./FacebookPagesPanel";
import InstagramDesk from "./InstagramDesk";
import SocialProfileManager from "./SocialProfileManager";

const integrationIcons = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  tiktok: Video,
  youtube: Youtube,
  google_business: MapPin,
  meta_ads: Megaphone,
  google_ads: Search,
} as const;

const stateLabels = {
  connected: "Conectado",
  ready_for_oauth: "Pronto para OAuth",
  configured_unvalidated: "Configuração não validada",
  awaiting_credentials: "Aguardando credenciais",
  connector_planned: "Conector pendente",
  error: "Requer correção",
} as const;

function stateClasses(state: keyof typeof stateLabels) {
  if (state === "connected") return "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
  if (state === "ready_for_oauth") return "border-sky-300/25 bg-sky-300/10 text-sky-100";
  if (state === "error") return "border-red-300/25 bg-red-300/10 text-red-100";
  if (state === "configured_unvalidated") return "border-orange-300/25 bg-orange-300/10 text-orange-100";
  if (state === "connector_planned") return "border-amber-300/25 bg-amber-300/10 text-amber-100";
  return "border-white/10 bg-white/[.03] text-slate-400";
}

function capabilityLabel(value: boolean, label: string) {
  return <span className={value ? "text-[#f2d39a]" : "text-slate-600"}>{value ? "✓" : "—"} {label}</span>;
}

export default function NetworkHub() {
  const readiness = trpc.externalIntegrations.status.useQuery(undefined, { refetchOnWindowFocus: false });
  const integrations = readiness.data?.integrations ?? [];

  return <div className="space-y-7">
    <section className="saas-hero rounded-3xl p-6 sm:p-8">
      <div className="saas-eyebrow"><Network className="h-3.5 w-3.5" /> Central de distribuição</div>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Conecte as contas sem compartilhar senhas.</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">O painel mostra o estado técnico real de cada integração. Cadastro público e simples presença de variáveis não significam OAuth validado; publicação e métricas só aparecem como disponíveis quando o conector existe e a autorização oficial foi confirmada.</p>
      {readiness.data && <div className="mt-6 flex flex-wrap gap-3 text-xs">
        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/8 px-3 py-1.5 text-emerald-100"><strong>{readiness.data.connectedCount}</strong> conectado(s)</span>
        <span className="rounded-full border border-sky-300/20 bg-sky-300/8 px-3 py-1.5 text-sky-100"><strong>{readiness.data.readyForOAuthCount}</strong> pronto(s) para OAuth</span>
        <span className="rounded-full border border-white/10 bg-white/[.03] px-3 py-1.5 text-slate-400"><strong>{readiness.data.blockedCount}</strong> dependente(s) de validação/configuração/conector</span>
      </div>}
    </section>

    {readiness.isLoading ? <section className="saas-card p-6 text-sm text-slate-400">Verificando disponibilidade das integrações sem expor credenciais...</section> : readiness.isError ? <section className="saas-card border-red-300/20 p-6 text-sm text-red-100">Não foi possível consultar o estado das integrações. Nenhuma conexão será considerada ativa até a verificação voltar a funcionar.</section> : <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {integrations.map(integration => {
        const Icon = integrationIcons[integration.id] ?? Network;
        return <article key={integration.id} className="saas-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c99550]/10 text-[#e3bd7f]"><Icon className="h-5 w-5" /></div>
            <Badge variant="outline" className={`text-[10px] ${stateClasses(integration.state)}`}>{stateLabels[integration.state]}</Badge>
          </div>
          <div className="mt-5 flex items-center gap-2"><h3 className="font-semibold text-white">{integration.label}</h3><span className="rounded-full border border-white/8 px-2 py-0.5 text-[9px] uppercase tracking-wider text-slate-600">{integration.category}</span></div>
          <p className="mt-2 min-h-16 text-xs leading-5 text-slate-500">{integration.detail}</p>
          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-white/7 pt-4 text-[10px]">
            {capabilityLabel(integration.capabilities.oauth, "OAuth")}
            {capabilityLabel(integration.capabilities.publish, "Publicação")}
            {capabilityLabel(integration.capabilities.schedule, "Agenda")}
            {capabilityLabel(integration.capabilities.analytics, "Analytics")}
          </div>
          {!integration.connected && integration.missingConfiguration.length > 0 && <div className="mt-4 flex items-start gap-2 rounded-lg border border-white/8 bg-black/15 px-3 py-2 text-[10px] leading-4 text-slate-500"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>Configuração protegida pendente: {integration.missingConfiguration.join(", ")}. O painel exibe somente rótulos genéricos, nunca nomes internos ou valores protegidos.</span></div>}
          {integration.state === "configured_unvalidated" && <div className="mt-4 flex items-start gap-2 rounded-lg border border-orange-300/20 bg-orange-300/8 px-3 py-2 text-[10px] leading-4 text-orange-100"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>Há configuração no cofre, mas ela ainda não foi validada pela plataforma externa. Publicação permanece bloqueada.</span></div>}
          {integration.connected && <div className="mt-4 flex items-center gap-2 text-[11px] text-emerald-100"><ShieldCheck className="h-3.5 w-3.5" />Conexão oficial validada.</div>}
        </article>;
      })}
    </section>}

    <SocialProfileManager />
    <FacebookPagesPanel />
    <InstagramDesk />
  </div>;
}
