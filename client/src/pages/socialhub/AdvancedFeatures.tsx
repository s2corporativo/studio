import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Instagram, MapPin, Clock, AlertTriangle, FileBarChart, Bell, Repeat,
  TrendingUp, Scale, Users, Palette, Loader2, Sparkles, CheckCircle2,
  ExternalLink, Download, RefreshCw, Star, Shield, Zap, Eye, Heart,
  MessageCircle, ThumbsUp, Calendar, ChevronRight, AlertCircle, Send,
} from "lucide-react";
import { toast } from "sonner";

// ============================================================
// MAIN PAGE
// ============================================================
export default function AdvancedFeatures() {
  const [activeTab, setActiveTab] = useState("instagram");

  const tabs = [
    { value: "instagram", label: "Instagram OAuth", icon: Instagram },
    { value: "google", label: "Google Negócio", icon: MapPin },
    { value: "schedule", label: "Agendamento IA", icon: Clock },
    { value: "replies", label: "Auto-Resposta", icon: AlertTriangle },
    { value: "roi", label: "Relatório ROI", icon: FileBarChart },
    { value: "evergreen", label: "Evergreen", icon: Repeat },
    { value: "trends", label: "Tendências", icon: TrendingUp },
    { value: "jusbrasil", label: "JusBrasil", icon: Scale },
    { value: "team", label: "Equipe", icon: Users },
    { value: "whitelabel", label: "White-label", icon: Palette },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Funcionalidades Avançadas</h1>
          <p className="text-sm text-muted-foreground">15 recursos para escalar suas empresas</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 p-1 bg-muted">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5 text-xs">
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{t.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="instagram" className="mt-4"><InstagramOAuthTab /></TabsContent>
        <TabsContent value="google" className="mt-4"><GoogleBusinessTab /></TabsContent>
        <TabsContent value="schedule" className="mt-4"><SmartScheduleTab /></TabsContent>
        <TabsContent value="replies" className="mt-4"><AutoReplyTab /></TabsContent>
        <TabsContent value="roi" className="mt-4"><ROIReportTab /></TabsContent>
        <TabsContent value="evergreen" className="mt-4"><EvergreenTab /></TabsContent>
        <TabsContent value="trends" className="mt-4"><TrendsTab /></TabsContent>
        <TabsContent value="jusbrasil" className="mt-4"><JusBrasilTab /></TabsContent>
        <TabsContent value="team" className="mt-4"><TeamTab /></TabsContent>
        <TabsContent value="whitelabel" className="mt-4"><WhiteLabelTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// #1 INSTAGRAM OAUTH
// ============================================================
function InstagramOAuthTab() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/socialhub/instagram/oauth/start");
      const data = await res.json();
      setStatus(data);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  async function handlePublish() {
    if (!caption.trim()) { toast.error("Digite uma legenda"); return; }
    setPublishing(true);
    try {
      await fetch("/api/socialhub/instagram/publish", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, imageUrl }),
      });
      toast.success("Post na fila de publicação!");
      setCaption(""); setImageUrl("");
    } catch (e: any) { toast.error(e.message); }
    finally { setPublishing(false); }
  }

  if (loading) return <Skeleton className="h-64 rounded-xl" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Instagram className="w-5 h-5 text-pink-500" /> Instagram OAuth2</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-pink-500/5 border border-pink-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-pink-500" />
              <span className="text-sm font-semibold">Fluxo OAuth2 Completo</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{status?.message || "Configure as credenciais do Meta para conectar."}</p>
            <div className="flex flex-wrap gap-2">
              <a href={status?.authUrl} target="_blank" rel="noopener noreferrer">
                <Button className="gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90">
                  <Instagram className="w-4 h-4" /> Conectar Instagram
                </Button>
              </a>
              <a href="https://developers.facebook.com/docs/instagram-api" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2"><ExternalLink className="w-4 h-4" /> Docs API</Button>
              </a>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold">Scopes necessários:</p>
            <div className="flex flex-wrap gap-1">
              {(status?.scope || "instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights,pages_read_engagement").split(",").map((s: string) => (
                <code key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{s.trim()}</code>
              ))}
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label className="text-xs">Publicar no Instagram</Label>
            <Textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Legenda do post..." rows={3} className="resize-none" />
            <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="URL da imagem (opcional)" />
            <Button onClick={handlePublish} disabled={publishing || !caption.trim()} className="gap-2 w-full">
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Publicar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// #2 GOOGLE MEU NEGÓCIO
// ============================================================
function GoogleBusinessTab() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", ctaType: "LEARN_MORE", actionUrl: "" });

  useEffect(() => {
    fetch("/api/socialhub/google-business/reviews").then(r => r.json()).then(d => { setReviews(d.reviews || []); setLoading(false); });
  }, []);

  async function handlePost() {
    if (!form.title || !form.content) { toast.error("Preencha título e conteúdo"); return; }
    setPosting(true);
    try {
      await fetch("/api/socialhub/google-business/post", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      toast.success("Post local criado!"); setForm({ title: "", content: "", ctaType: "LEARN_MORE", actionUrl: "" });
    } catch { toast.error("Erro"); } finally { setPosting(false); }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-500" /> Google Meu Negócio</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3 text-xs">
            <p className="font-semibold mb-1">📍 Posts locais no Google Maps e Search</p>
            <p className="text-muted-foreground">Publique ofertas, eventos e atualizações que aparecem no Google Maps e na busca local.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input placeholder="Título do post" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="URL de ação (opcional)" value={form.actionUrl} onChange={e => setForm({ ...form, actionUrl: e.target.value })} />
          </div>
          <Textarea placeholder="Conteúdo do post local..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={3} className="resize-none" />
          <Button onClick={handlePost} disabled={posting} className="gap-2 w-full"><MapPin className="w-4 h-4" /> {posting ? "Publicando..." : "Publicar no Google"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Star className="w-4 h-4 text-amber-500" /> Avaliações Recentes</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-32" /> : (
            <div className="space-y-2">
              {reviews.map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="flex items-center gap-1 shrink-0">
                    {[...Array(5)].map((_, s) => <Star key={s} className={`w-3 h-3 ${s < r.rating ? "text-amber-400 fill-amber-400" : "text-muted"}`} />)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{r.author}</p>
                    <p className="text-xs text-muted-foreground">{r.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">{r.date}</span>
                      {!r.replied && <Badge variant="secondary" className="text-[9px] gap-0.5 text-amber-600"><AlertCircle className="w-2.5 h-2.5" /> Sem resposta</Badge>}
                    </div>
                  </div>
                  {!r.replied && <Button size="sm" variant="ghost" className="text-xs h-7">Responder</Button>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// #3 SMART SCHEDULING
// ============================================================
function SmartScheduleTab() {
  const [niche, setNiche] = useState("Advocacia");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleAnalyze() {
    setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/socialhub/smart-schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ niche, platforms: ["instagram", "facebook", "linkedin"] }) });
      const data = await res.json(); setResult(data); toast.success("Análise concluída!");
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-violet-500" /> Agendamento Inteligente</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Nicho (ex: Advocacia)" />
            <Button onClick={handleAnalyze} disabled={loading} className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Analisar
            </Button>
          </div>
          {result?.recommendations?.map((rec: any, i: number) => (
            <Card key={i} className="p-4">
              <p className="font-semibold text-sm capitalize mb-2 flex items-center gap-2">
                <Badge variant="secondary">{rec.platform}</Badge> {rec.timezone}
              </p>
              <div className="grid sm:grid-cols-3 gap-2">
                {rec.bestTimes?.map((bt: any, j: number) => (
                  <div key={j} className="rounded-lg border p-3 text-center">
                    <p className="text-xs font-bold capitalize">{bt.day}</p>
                    <p className="text-lg font-bold text-violet-500">{bt.time}</p>
                    <p className="text-[10px] text-muted-foreground">{bt.reason}</p>
                    <Badge className={`mt-1 text-[9px] ${bt.expectedEngagement === "alto" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{bt.expectedEngagement}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          ))}
          {result?.insights && (
            <div className="rounded-lg bg-violet-500/5 border border-violet-500/20 p-3">
              <p className="text-xs font-semibold mb-1">💡 Insights</p>
              {result.insights.map((ins: string, i: number) => <p key={i} className="text-xs text-muted-foreground">• {ins}</p>)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// #4 AUTO-RESPOSTA A MENÇÕES NEGATIVAS
// ============================================================
function AutoReplyTab() {
  const [mention, setMention] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/socialhub/mentions/negative-alerts").then(r => r.json()).then(d => setAlerts(d.alerts || []));
  }, []);

  async function handleGenerate() {
    if (!mention.trim()) { toast.error("Digite a menção"); return; }
    setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/socialhub/mentions/auto-reply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mention, brandName: "De Paula Advocacia" }) });
      const data = await res.json(); setResult(data); toast.success("Resposta gerada!");
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <Card className="border-rose-500/30">
        <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-rose-500" /> Auto-Resposta a Menções Negativas</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {alerts.length > 0 && (
            <div className="rounded-lg bg-rose-500/5 border border-rose-500/20 p-3">
              <p className="text-xs font-semibold text-rose-600 mb-1">⚠️ {alerts.length} alerta(s) de menção negativa</p>
              {alerts.slice(0, 3).map((a, i) => <p key={i} className="text-xs text-muted-foreground truncate">• {a.body}</p>)}
            </div>
          )}
          <Textarea value={mention} onChange={e => setMention(e.target.value)} placeholder="Cole aqui a menção negativa..." rows={3} className="resize-none" />
          <Button onClick={handleGenerate} disabled={loading} className="gap-2 w-full bg-gradient-to-r from-rose-500 to-orange-500">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Gerar Resposta
          </Button>
          {result && (
            <div className="space-y-3">
              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={result.urgency === "high" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}>Urgência: {result.urgency}</Badge>
                  {result.escalate && <Badge variant="destructive">Escalar</Badge>}
                </div>
                <p className="text-sm">{result.reply}</p>
              </div>
              {result.suggestedAction && <p className="text-xs text-muted-foreground">📋 {result.suggestedAction}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// #5 ROI REPORT
// ============================================================
function ROIReportTab() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [company, setCompany] = useState("De Paula Advocacia");

  async function handleGenerate() {
    setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/socialhub/reports/roi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ companyName: company, period: "Agosto 2026", posts: 15, metrics: { reach: 45000, engagement: 3200 }, competitors: 4 }) });
      const data = await res.json(); setResult(data); toast.success("Relatório gerado!");
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  function handleDownload() {
    if (!result?.downloadContent) return;
    const blob = new Blob([result.downloadContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `roi-${company.replace(/\s+/g, "-")}.txt`; a.click();
    URL.revokeObjectURL(url); toast.success("Relatório baixado!");
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileBarChart className="w-5 h-5 text-emerald-500" /> Relatório de ROI</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Nome da empresa" />
            <Button onClick={handleGenerate} disabled={loading} className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Gerar
            </Button>
          </div>
          {result && (
            <div className="space-y-3">
              <div className="rounded-lg border p-4">
                <p className="text-sm font-semibold mb-1">{result.title}</p>
                <p className="text-xs text-muted-foreground">{result.summary}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { label: "Alcance", value: result.metrics?.reach, icon: Eye },
                  { label: "Engajamento", value: result.metrics?.engagement, icon: Heart },
                  { label: "Leads", value: result.metrics?.leads, icon: Users },
                  { label: "ROI", value: result.metrics?.estimatedROI, icon: TrendingUp },
                  { label: "Custo/Lead", value: result.metrics?.costPerLead, icon: FileBarChart },
                ].map(m => { const Icon = m.icon; return (
                  <div key={m.label} className="rounded-lg border p-3 text-center">
                    <Icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-sm font-bold">{m.value || "—"}</p>
                    <p className="text-[9px] text-muted-foreground">{m.label}</p>
                  </div>
                ); })}
              </div>
              {result.recommendations && (
                <div><p className="text-xs font-semibold mb-1">💡 Recomendações</p>{result.recommendations.map((r: string, i: number) => <p key={i} className="text-xs text-muted-foreground">• {r}</p>)}</div>
              )}
              <Button onClick={handleDownload} className="gap-2 w-full"><Download className="w-4 h-4" /> Baixar Relatório</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// #10 EVERGREEN CONTENT
// ============================================================
function EvergreenTab() {
  const [evergreen, setEvergreen] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/socialhub/evergreen").then(r => r.json()).then(d => { setEvergreen(d.evergreen || []); setLoading(false); });
  }, []);

  async function handleRepublish(postId: number) {
    const date = new Date(); date.setDate(date.getDate() + 7);
    await fetch("/api/socialhub/evergreen/republish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId, scheduledAt: date.toISOString() }) });
    toast.success("Conteúdo evergreen agendado para republicação!");
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Repeat className="w-5 h-5 text-cyan-500" /> Banco de Conteúdo Evergreen</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/20 p-3 mb-4 text-xs">
            <p className="font-semibold">♻️ Conteúdo atemporal identificado automaticamente</p>
            <p className="text-muted-foreground mt-1">Posts educacionais e guias que podem ser republicados com atualizações.</p>
          </div>
          {loading ? <Skeleton className="h-32" /> : evergreen.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum conteúdo evergreen encontrado ainda.</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {evergreen.map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border hover:border-cyan-500/40">
                  <Repeat className="w-4 h-4 text-cyan-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{p.caption}</p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs gap-1 shrink-0" onClick={() => handleRepublish(p.id)}>
                    <Calendar className="w-3 h-3" /> Republicar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// #12 TRENDS ANALYSIS
// ============================================================
function TrendsTab() {
  const [niche, setNiche] = useState("Advocacia");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleAnalyze() {
    setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/socialhub/trends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ niche }) });
      const data = await res.json(); setResult(data); toast.success("Tendências analisadas!");
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-orange-500" /> Análise de Tendências</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Nicho" />
            <Button onClick={handleAnalyze} disabled={loading} className="gap-2 bg-gradient-to-r from-orange-500 to-red-500">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />} Analisar
            </Button>
          </div>
          {result?.trends?.map((t: any, i: number) => (
            <div key={i} className="rounded-lg border p-3 hover:border-orange-500/40">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">🔥 {t.topic}</span>
                <Badge variant="secondary" className="text-[9px]">{t.platform}</Badge>
                <Badge className={`text-[9px] ${t.urgency === "alta" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>{t.urgency}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-1">{t.why}</p>
              <p className="text-xs font-medium">💡 {t.contentAngle}</p>
            </div>
          ))}
          {result?.hashtags && (
            <div><p className="text-xs font-semibold mb-1">Hashtags em alta</p><div className="flex flex-wrap gap-1">{result.hashtags.map((h: string, i: number) => <code key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted">#{h}</code>)}</div></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// #13 JUSBRASIL
// ============================================================
function JusBrasilTab() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleSearch() {
    if (!query.trim()) { toast.error("Digite um termo"); return; }
    setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/socialhub/jusbrasil/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, area: "Direito Civil" }) });
      const data = await res.json(); setResult(data); toast.success("Jurisprudência encontrada!");
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Scale className="w-5 h-5 text-indigo-500" /> JusBrasil — Jurisprudência</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-indigo-500/5 border border-indigo-500/20 p-3 text-xs">
            <p className="font-semibold">⚖️ Monitorar jurisprudência e gerar conteúdo</p>
            <p className="text-muted-foreground mt-1">Busque decisões relevantes e transforme em posts para redes sociais.</p>
          </div>
          <div className="flex gap-2">
            <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Ex: dano moral, contrato..." onKeyDown={e => e.key === "Enter" && handleSearch()} />
            <Button onClick={handleSearch} disabled={loading} className="gap-2"><Scale className="w-4 h-4" /> {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}</Button>
          </div>
          {result?.results?.map((r: any, i: number) => (
            <div key={i} className="rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-[9px]">{r.court}</Badge>
                <Badge className={`text-[9px] ${r.relevance === "alta" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>Relevância: {r.relevance}</Badge>
                <span className="text-[10px] text-muted-foreground ml-auto">{r.date}</span>
              </div>
              <p className="text-sm font-medium">{r.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{r.summary}</p>
              <div className="mt-2 rounded bg-muted/50 p-2">
                <p className="text-xs font-medium">📝 {r.contentAngle}</p>
                <div className="flex flex-wrap gap-1 mt-1">{r.hashtags?.map((h: string, j: number) => <code key={j} className="text-[9px] px-1 py-0.5 rounded bg-muted">#{h}</code>)}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// #14 TEAM HIERARCHY
// ============================================================
function TeamTab() {
  const [team, setTeam] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/socialhub/team").then(r => r.json()).then(d => { setTeam(d.team || []); setRoles(d.roles || []); setLoading(false); });
  }, []);

  async function handleApprove(postId: number, decision: string) {
    await fetch("/api/socialhub/team/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId, decision }) });
    toast.success(decision === "approved" ? "Post aprovado!" : "Post rejeitado");
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-violet-500" /> Equipe & Aprovação Hierárquica</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {roles.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {roles.map(r => (
                <div key={r.level} className="rounded-lg border p-3">
                  <p className="text-sm font-semibold">{r.label}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {r.permissions.map((p: string) => <span key={p} className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground">{p}</span>)}
                  </div>
                  {r.canApprove && <Badge className="mt-1 text-[9px] bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Pode aprovar</Badge>}
                </div>
              ))}
            </div>
          )}
          <Separator />
          {loading ? <Skeleton className="h-32" /> : (
            <div className="space-y-2">
              <p className="text-xs font-semibold">Membros da equipe</p>
              {team.map((m, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold">{(m.name || "?").charAt(0)}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{m.name || "Usuário"}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <Badge variant="secondary" className="text-[9px]">{m.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// #15 WHITE-LABEL
// ============================================================
function WhiteLabelTab() {
  const [config, setConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetch("/api/socialhub/whitelabel/config").then(r => r.json()).then(setConfig); }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/socialhub/whitelabel/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config.branding) });
      toast.success("Configurações salvas!");
    } catch { toast.error("Erro"); } finally { setSaving(false); }
  }

  if (!config) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5 text-fuchsia-500" /> White-label</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Nome do App</Label><Input value={config.branding.appName} onChange={e => setConfig({ ...config, branding: { ...config.branding, appName: e.target.value } })} /></div>
            <div><Label className="text-xs">Cor Primária</Label><div className="flex gap-2"><input type="color" value={config.branding.primaryColor} onChange={e => setConfig({ ...config, branding: { ...config.branding, primaryColor: e.target.value } })} className="w-12 h-9 rounded border" /><Input value={config.branding.primaryColor} onChange={e => setConfig({ ...config, branding: { ...config.branding, primaryColor: e.target.value } })} /></div></div>
            <div><Label className="text-xs">Cor Secundária</Label><div className="flex gap-2"><input type="color" value={config.branding.secondaryColor} onChange={e => setConfig({ ...config, branding: { ...config.branding, secondaryColor: e.target.value } })} className="w-12 h-9 rounded border" /><Input value={config.branding.secondaryColor} onChange={e => setConfig({ ...config, branding: { ...config.branding, secondaryColor: e.target.value } })} /></div></div>
            <div><Label className="text-xs">Domínio Customizado</Label><Input value={config.branding.customDomain || ""} onChange={e => setConfig({ ...config, branding: { ...config.branding, customDomain: e.target.value } })} placeholder="app.suaempresa.com" /></div>
          </div>
          <div className="flex items-center gap-2"><Switch checked={config.branding.poweredBy} onCheckedChange={v => setConfig({ ...config, branding: { ...config.branding, poweredBy: v } }))} /><Label className="text-xs">Exibir "Powered by SocialHub"</Label></div>
          <Button onClick={handleSave} disabled={saving} className="gap-2 w-full"><Palette className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar Configurações"}</Button>
          <Separator />
          <div><p className="text-xs font-semibold mb-2">Planos disponíveis</p><div className="grid sm:grid-cols-3 gap-2">{config.plans?.map((p: any) => (
            <div key={p.name} className="rounded-lg border p-3"><p className="font-semibold text-sm">{p.name}</p><p className="text-lg font-bold text-fuchsia-500">{p.price}</p><div className="mt-1 space-y-0.5">{p.features.map((f: string, i: number) => <p key={i} className="text-[10px] text-muted-foreground">✓ {f}</p>)}</div></div>
          ))}</div></div>
        </CardContent>
      </Card>
    </div>
  );
}
