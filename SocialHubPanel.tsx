import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plug, Radar, ImageIcon, Sparkles, Loader2, RefreshCw, Trash2,
  Smile, Frown, Meh, Eye, Heart, MessageCircle, ExternalLink,
  Shield, Zap, Clock, CheckCircle2, AlertCircle, Download,
  Key, Lock, Star, Globe, Hash,
} from "lucide-react";
import { toast } from "sonner";

// ===== Integrations data =====
const PLATFORM_INTEGRATIONS = [
  {
    platform: "instagram", label: "Instagram", color: "#E1306C",
    apiName: "Instagram Graph API",
    apiDocsUrl: "https://developers.facebook.com/docs/instagram-api",
    capabilities: ["Publicação", "Analytics", "Menções", "Stories", "Reels", "Agendamento", "Insights"],
    pricing: "Gratuito (até 200 chamadas/hora)",
    scopes: ["instagram_basic", "instagram_content_publish", "instagram_manage_insights", "pages_read_engagement"],
    setupSteps: [
      "Criar conta no Meta for Developers (developers.facebook.com)",
      "Criar um App do tipo Business",
      "Adicionar produto Instagram Graph API",
      "Configurar login OAuth com os scopes necessários",
      "Solicitar revisão do app (App Review)",
      "Obter Access Token de longa duração (60 dias)",
      "Conectar Instagram Business Account (conta comercial obrigatória)",
      "Configurar webhook para notificações em tempo real",
    ],
  },
  {
    platform: "facebook", label: "Facebook", color: "#1877F2",
    apiName: "Facebook Graph API",
    apiDocsUrl: "https://developers.facebook.com/docs/graph-api",
    capabilities: ["Publicação", "Analytics", "Menções", "Reels", "Agendamento", "Insights", "DM"],
    pricing: "Gratuito (até 200 chamadas/hora)",
    scopes: ["pages_manage_posts", "pages_read_engagement", "pages_messaging", "read_insights"],
    setupSteps: [
      "Criar conta no Meta for Developers",
      "Criar App do tipo Business",
      "Adicionar produto Facebook Login",
      "Configurar URLs de redirecionamento OAuth",
      "Solicitar App Review para permissões públicas",
      "Obter Page Access Token",
      "Configurar webhook para webhooks de páginas",
    ],
  },
  {
    platform: "linkedin", label: "LinkedIn", color: "#0A66C2",
    apiName: "LinkedIn Marketing API",
    apiDocsUrl: "https://docs.microsoft.com/linkedin/marketing",
    capabilities: ["Publicação", "Analytics", "Agendamento", "Insights"],
    pricing: "Gratuito (requer aprovação)",
    scopes: ["w_member_social", "rw_organization_admin", "w_organization_social", "r_organization_social"],
    setupSteps: [
      "Criar conta no LinkedIn Developers (developer.linkedin.com)",
      "Criar um App",
      "Adicionar produto Share on LinkedIn e Marketing Developer Platform",
      "Configurar URL de redirecionamento OAuth2",
      "Verificar a Company Page (Domain Verification)",
      "Solicitar acesso à Marketing API (pode levar até 7 dias)",
      "Obter Access Token com organization scopes",
    ],
  },
  {
    platform: "twitter", label: "Twitter / X", color: "#000000",
    apiName: "Twitter API v2",
    apiDocsUrl: "https://developer.twitter.com/en/docs/twitter-api",
    capabilities: ["Publicação", "Analytics", "Menções", "Insights", "DM"],
    pricing: "Basic: $100/mês | Pro: $5000/mês",
    scopes: ["tweet.read", "tweet.write", "users.read", "dm.read", "dm.write"],
    setupSteps: [
      "Criar conta no Twitter Developer Portal (developer.twitter.com)",
      "Escolher plano: Free, Basic ($100/mês) ou Pro ($5000/mês)",
      "Criar um App e gerar API Keys",
      "Configurar OAuth 2.0 com PKCE",
      "Solicitar elevated access para posting",
      "Configurar webhook para menções em tempo real",
    ],
  },
  {
    platform: "tiktok", label: "TikTok", color: "#000000",
    apiName: "TikTok Business API",
    apiDocsUrl: "https://developers.tiktok.com/doc/business-api",
    capabilities: ["Publicação", "Analytics", "Menções", "Reels", "Agendamento", "Insights"],
    pricing: "Gratuito (requer conta Business)",
    scopes: ["video.publish", "video.list", "user.info.basic", "analytics.read"],
    setupSteps: [
      "Criar conta no TikTok for Developers (developers.tiktok.com)",
      "Criar um App Business",
      "Configurar OAuth 2.0",
      "Solicitar acesso à Content Posting API",
      "Obter Access Token",
    ],
  },
  {
    platform: "youtube", label: "YouTube", color: "#FF0000",
    apiName: "YouTube Data API v3",
    apiDocsUrl: "https://developers.google.com/youtube/v3",
    capabilities: ["Publicação", "Analytics", "Agendamento", "Insights"],
    pricing: "Gratuito (10.000 unidades/dia)",
    scopes: ["youtube.upload", "youtube.readonly", "yt-analytics.readonly"],
    setupSteps: [
      "Criar projeto no Google Cloud Console",
      "Habilitar YouTube Data API v3 e YouTube Analytics API",
      "Criar credenciais OAuth 2.0",
      "Configurar telas de consentimento",
      "Solicitar verificação para escopos sensíveis",
      "Obter Access Token via OAuth flow",
    ],
  },
  {
    platform: "google_my_business", label: "Google Meu Negócio", color: "#4285F4",
    apiName: "Google Business Profile API",
    apiDocsUrl: "https://developers.google.com/my-business",
    capabilities: ["Publicação local", "Analytics", "Menções", "Insights"],
    pricing: "Gratuito",
    scopes: ["business.manage", "business.performance", "business.communications"],
    setupSteps: [
      "Criar projeto no Google Cloud Console",
      "Habilitar Google Business Profile API",
      "Criar credenciais OAuth 2.0",
      "Solicitar acesso à API (requer aprovação)",
      "Verificar propriedade do negócio",
      "Obter Access Token",
    ],
  },
  {
    platform: "google_analytics", label: "Google Analytics", color: "#E37400",
    apiName: "Google Analytics Data API",
    apiDocsUrl: "https://developers.google.com/analytics/devguides/reporting/data/v1",
    capabilities: ["Analytics", "Insights"],
    pricing: "Gratuito",
    scopes: ["analytics.readonly", "analytics.reporting"],
    setupSteps: [
      "Criar projeto no Google Cloud Console",
      "Habilitar Google Analytics Data API v1",
      "Criar credenciais OAuth 2.0",
      "Obter GA4 Property ID",
      "Autorizar acesso via OAuth",
    ],
  },
];

// ===== SocialHub Page =====
export default function SocialHubPanel() {
  const [activeTab, setActiveTab] = useState("integrations");

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">SocialHub — Hub de Integrações</h1>
          <p className="text-sm text-muted-foreground">
            APIs necessárias para escalar suas empresas na internet
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="integrations" className="gap-1.5">
            <Plug className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Integrações</span>
          </TabsTrigger>
          <TabsTrigger value="listening" className="gap-1.5">
            <Radar className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Menções</span>
          </TabsTrigger>
          <TabsTrigger value="media" className="gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mídia IA</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="mt-4">
          <IntegrationsTab />
        </TabsContent>
        <TabsContent value="listening" className="mt-4">
          <ListeningTab />
        </TabsContent>
        <TabsContent value="media" className="mt-4">
          <MediaStudioTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===== Integrations Tab =====
function IntegrationsTab() {
  const [connected, setConnected] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-4">
      <Card className="border-violet-500/30 bg-violet-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold mb-1">Como funciona a integração real?</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cada rede social possui uma API oficial que permite publicação automática, leitura de
                métricas e monitoramento. Para conectar, crie um App no portal de desenvolvedores,
                obtenha credenciais OAuth e approve o app. As credenciais são armazenadas com criptografia.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLATFORM_INTEGRATIONS.map((plat, i) => {
          const isConnected = connected[plat.platform];
          return (
            <Card key={plat.platform} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-white text-lg"
                    style={{ backgroundColor: plat.color }}
                  >
                    {plat.label.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{plat.label}</h3>
                      {isConnected ? (
                        <Badge className="text-[9px] gap-0.5 bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Conectado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[9px]">Desconectado</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{plat.apiName}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {plat.capabilities.map(cap => (
                    <span key={cap} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {cap}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Preço:</span>
                  <span className="font-medium">{plat.pricing}</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {isConnected ? (
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5"
                      onClick={() => setConnected(prev => ({ ...prev, [plat.platform]: false }))}>
                      Desconectar
                    </Button>
                  ) : (
                    <Button size="sm" className="h-8 text-xs gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90"
                      onClick={() => { setConnected(prev => ({ ...prev, [plat.platform]: true })); toast.success(`${plat.label} conectado!`); }}>
                      <Plug className="w-3 h-3" /> Conectar
                    </Button>
                  )}
                  <a href={plat.apiDocsUrl} target="_blank" rel="noopener noreferrer"
                    className="ml-auto text-xs text-muted-foreground hover:text-violet-500 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Docs
                  </a>
                </div>

                {/* Setup steps */}
                <details className="pt-1">
                  <summary className="text-xs font-medium cursor-pointer text-violet-500 hover:underline">
                    Ver passo a passo de configuração ({plat.setupSteps.length} passos)
                  </summary>
                  <ol className="mt-2 space-y-1">
                    {plat.setupSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs">
                        <span className="w-4 h-4 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0 text-[9px] font-bold mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {plat.scopes.map(scope => (
                      <code key={scope} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {scope}
                      </code>
                    ))}
                  </div>
                </details>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ===== Social Listening Tab =====
type Mention = {
  id: number;
  authorName: string | null;
  authorHandle: string | null;
  body: string;
  network: string;
  kind: string;
  status: string;
  receivedAt: string | Date;
};

function ListeningTab() {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const fetchMentions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/socialhub/mentions");
      const data = await res.json();
      setMentions(data.mentions || []);
      setSummary(data.summary);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMentions(); }, [fetchMentions]);

  async function handleScan() {
    setScanning(true);
    try {
      const res = await fetch("/api/socialhub/mentions/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName: "S2 Studio", niche: "Advocacia" }),
      });
      const data = await res.json();
      if (data.count) {
        toast.success(`${data.count} menções encontradas!`);
        fetchMentions();
      } else {
        toast.error("Nenhuma menção encontrada");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao escanear");
    } finally {
      setScanning(false);
    }
  }

  const sentimentMeta: Record<string, { color: string; icon: any; label: string }> = {
    positive: { color: "#10B981", icon: Smile, label: "Positivo" },
    neutral: { color: "#6B7280", icon: Meh, label: "Neutro" },
    negative: { color: "#EF4444", icon: Frown, label: "Negativo" },
    question: { color: "#6B7280", icon: MessageCircle, label: "Pergunta" },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold">Monitoramento de Menções</h3>
          <p className="text-xs text-muted-foreground">Social listening com análise de sentimento via IA</p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90"
          onClick={handleScan} disabled={scanning}>
          {scanning ? <><Loader2 className="w-4 h-4 animate-spin" /> Escaneando...</> : <><Radar className="w-4 h-4" /> Escanear menções</>}
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: summary.total, color: "#7C3AED", icon: Radar },
            { label: "Positivas", value: `${summary.positivePct}%`, color: "#10B981", icon: Smile },
            { label: "Neutras", value: `${summary.neutralPct}%`, color: "#6B7280", icon: Meh },
            { label: "Negativas", value: `${summary.negativePct}%`, color: "#EF4444", icon: Frown },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : mentions.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Radar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma menção encontrada ainda</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Clique em "Escanear menções" para buscar com IA</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {mentions.map((m, i) => {
            const sm = sentimentMeta[m.kind] || sentimentMeta.neutral;
            const SentimentIcon = sm.icon;
            return (
              <Card key={m.id || i} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                      style={{ backgroundColor: sm.color }}>
                      {(m.authorName || "?").charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm">{m.authorName || "Anônimo"}</span>
                        {m.authorHandle && <span className="text-xs text-muted-foreground">{m.authorHandle}</span>}
                        <Badge className="text-[9px] gap-0.5 ml-auto" style={{ backgroundColor: `${sm.color}20`, color: sm.color }}>
                          <SentimentIcon className="w-2.5 h-2.5" /> {sm.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{m.network}</p>
                      <p className="text-sm">{m.body}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== Media Studio Tab =====
function MediaStudioTab() {
  const [prompt, setPrompt] = useState("");
  const [orientation, setOrientation] = useState("square");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);

  const orientations = [
    { value: "square", label: "Quadrado", ratio: "1:1" },
    { value: "portrait", label: "Retrato", ratio: "4:3" },
    { value: "landscape", label: "Paisagem", ratio: "3:4" },
    { value: "story", label: "Story", ratio: "9:16" },
    { value: "wide", label: "Wide", ratio: "2:1" },
  ];

  async function handleGenerate() {
    if (!prompt.trim()) { toast.error("Descreva a imagem"); return; }
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch("/api/socialhub/media/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, orientation }),
      });
      const data = await res.json();
      if (data.url) {
        setResult(data.url);
        setGallery(prev => [data.url, ...prev]);
        toast.success("Imagem gerada com IA!");
      } else {
        toast.error(data.error || "Falha na geração");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Studio de Imagens com IA</h3>
        <p className="text-xs text-muted-foreground">Gere imagens profissionais para seus posts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Generator */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Descrição da imagem</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Xícara de café fumegante sobre mesa de madeira rústica, luz da manhã dourada..."
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Formato</Label>
              <div className="grid grid-cols-5 gap-1.5">
                {orientations.map(o => (
                  <button key={o.value}
                    onClick={() => setOrientation(o.value)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-all ${
                      orientation === o.value ? "border-violet-500 bg-violet-500/5 ring-1 ring-violet-500/30" : "border-border hover:border-violet-500/40"
                    }`}>
                    <div className={`rounded-sm bg-current ${orientation === o.value ? "text-violet-500" : "text-muted-foreground"}`}
                      style={{
                        width: o.value === "square" ? 16 : o.value === "portrait" || o.value === "story" ? 12 : 20,
                        height: o.value === "square" ? 16 : o.value === "portrait" || o.value === "story" ? 20 : 12,
                      }} />
                    <span className="text-[9px] font-medium">{o.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button className="w-full gap-2 h-10 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90"
              onClick={handleGenerate} disabled={generating || !prompt.trim()}>
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</> : <><Sparkles className="w-4 h-4" /> Gerar imagem</>}
            </Button>

            {result && (
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-violet-500" />
                  <span className="text-xs font-semibold">Imagem gerada!</span>
                </div>
                <img src={result} alt="Generated" className="w-full rounded-lg" />
                <a href={result} download className="block mt-2">
                  <Button variant="outline" size="sm" className="w-full gap-1.5">
                    <Download className="w-3.5 h-3.5" /> Baixar imagem
                  </Button>
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gallery */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-violet-500" />
              Galeria ({gallery.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gallery.length === 0 ? (
              <div className="py-10 text-center">
                <ImageIcon className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma imagem gerada ainda</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-[500px] overflow-y-auto">
                {gallery.map((url, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-border">
                    <img src={url} alt={`Generated ${i + 1}`} className="w-full aspect-square object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a href={url} download>
                        <Button size="sm" variant="secondary" className="h-7 text-xs gap-1">
                          <Download className="w-3 h-3" /> Baixar
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
