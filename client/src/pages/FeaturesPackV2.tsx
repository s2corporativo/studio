import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Send, Palette, Bot, Mail, Link as LinkIcon, DollarSign, Grid3x3, GitBranch,
  Mic, Brain, Layers, Users, Wallet, Bell, Calendar as CalIcon, Shield, Database,
  Loader2, Sparkles, CheckCircle2, Download, TrendingUp, Heart, Eye, Clock,
  AlertTriangle, Star, FileText, Smartphone, QrCode, Zap, Target,
} from "lucide-react";
import { toast } from "sonner";

const FEATURES = [
  { id: "autopost", label: "Auto-Post IG", icon: Send },
  { id: "editor", label: "Editor Visual", icon: Palette },
  { id: "chatbot", label: "Chatbot IA", icon: Bot },
  { id: "email", label: "E-mail Mkt", icon: Mail },
  { id: "linktree", label: "Link na Bio", icon: LinkIcon },
  { id: "roi", label: "ROI", icon: DollarSign },
  { id: "heatmap", label: "Heatmap", icon: Grid3x3 },
  { id: "abtest", label: "A/B Test", icon: GitBranch },
  { id: "voice", label: "Voz Marca", icon: Mic },
  { id: "predictive", label: "Predictive", icon: Brain },
  { id: "carousel", label: "Carrossel", icon: Layers },
  { id: "client", label: "Portal Cliente", icon: Users },
  { id: "finance", label: "Financeiro", icon: Wallet },
  { id: "push", label: "Push", icon: Bell },
  { id: "calendar", label: "Calendário", icon: CalIcon },
  { id: "lgpd", label: "LGPD", icon: Shield },
  { id: "backup", label: "Backup", icon: Database },
];

export default function FeaturesPackV2() {
  const [tab, setTab] = useState("autopost");
  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">S2 Studio — Features Pack v2</h1>
          <p className="text-sm text-muted-foreground">17 novas funcionalidades para escalar</p>
        </div>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 p-1 bg-muted">
          {FEATURES.map(f => { const Icon = f.icon; return (
            <TabsTrigger key={f.id} value={f.id} className="gap-1 text-xs px-2 py-1.5">
              <Icon className="w-3 h-3" /><span className="hidden xl:inline">{f.label}</span>
            </TabsTrigger>
          );})}
        </TabsList>
        <TabsContent value="autopost" className="mt-4"><AutoPostTab/></TabsContent>
        <TabsContent value="editor" className="mt-4"><EditorTab/></TabsContent>
        <TabsContent value="chatbot" className="mt-4"><ChatbotTab/></TabsContent>
        <TabsContent value="email" className="mt-4"><EmailTab/></TabsContent>
        <TabsContent value="linktree" className="mt-4"><LinkTreeTab/></TabsContent>
        <TabsContent value="roi" className="mt-4"><RoiTab/></TabsContent>
        <TabsContent value="heatmap" className="mt-4"><HeatmapTab/></TabsContent>
        <TabsContent value="abtest" className="mt-4"><ABTestTab/></TabsContent>
        <TabsContent value="voice" className="mt-4"><VoiceTab/></TabsContent>
        <TabsContent value="predictive" className="mt-4"><PredictiveTab/></TabsContent>
        <TabsContent value="carousel" className="mt-4"><CarouselTab/></TabsContent>
        <TabsContent value="client" className="mt-4"><ClientTab/></TabsContent>
        <TabsContent value="finance" className="mt-4"><FinanceTab/></TabsContent>
        <TabsContent value="push" className="mt-4"><PushTab/></TabsContent>
        <TabsContent value="calendar" className="mt-4"><CalendarTab/></TabsContent>
        <TabsContent value="lgpd" className="mt-4"><LgpdTab/></TabsContent>
        <TabsContent value="backup" className="mt-4"><BackupTab/></TabsContent>
      </Tabs>
    </div>
  );
}

function useApi(url: string, deps: any[] = []) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetchData = useCallback(() => {
    setLoading(true);
    fetch(url).then(r => r.json()).then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, [url]);
  useEffect(() => { fetchData(); }, [fetchData, ...deps]);
  return { data, loading, refresh: fetchData };
}

async function postApi(url: string, body: any) {
  return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json());
}

// #1 Auto-Post Instagram
function AutoPostTab() {
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [posting, setPosting] = useState(false);
  const { data: comments } = useApi("/api/v2/instagram/comments");

  async function handlePost() {
    if (!caption || !imageUrl) { toast.error("Preencha legenda e imagem"); return; }
    setPosting(true);
    try { const r = await postApi("/api/v2/instagram/auto-post", { caption, imageUrl }); toast.success(r.status === "published" ? "Publicado!" : "Post na fila!"); }
    catch { toast.error("Erro"); } finally { setPosting(false); }
  }
  return (
    <div className="space-y-4">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Send className="w-5 h-5 text-pink-500"/> Auto-Posting Instagram</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-pink-500/5 border border-pink-500/20 p-3 text-xs"><p className="font-semibold">📷 Publicação real via Instagram Graph API</p><p className="text-muted-foreground mt-1">Configure META_INSTAGRAM_ACCESS_TOKEN e META_IG_USER_ID no .env para publicação direta.</p></div>
          <Textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Legenda do post..." rows={3} className="resize-none"/>
          <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="URL da imagem"/>
          <Button onClick={handlePost} disabled={posting} className="gap-2 w-full bg-gradient-to-r from-pink-500 to-purple-600"><Send className="w-4 h-4"/>{posting ? "Publicando..." : "Publicar no Instagram"}</Button>
          <Separator/>
          <div><p className="text-xs font-semibold mb-2">Comentários recentes</p>{comments?.comments?.map((c: any) => (
            <div key={c.id} className="flex items-start gap-2 p-2 rounded-lg border mb-1"><div className="w-7 h-7 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs">{c.username[1]}</div><div className="flex-1"><p className="text-xs font-medium">{c.username}</p><p className="text-xs">{c.text}</p></div>{!c.replied && <Badge variant="secondary" className="text-[9px] text-amber-600">Sem resposta</Badge>}</div>
          ))}</div>
        </CardContent>
      </Card>
    </div>
  );
}

// #2 Editor Visual
function EditorTab() {
  const { data: templates } = useApi("/api/v2/editor/templates");
  return (
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5 text-violet-500"/> Editor Visual de Imagens</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-violet-500/5 border border-violet-500/20 p-3 text-xs"><p className="font-semibold">🎨 Crie artes sem sair do S2 Studio</p><p className="text-muted-foreground mt-1">Editor Canvas com templates, texto sobreposto e redimensionamento automático.</p></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {templates?.templates?.map((t: any) => (
            <div key={t.id} className="rounded-lg border p-3 hover:border-violet-500/40 cursor-pointer"><Palette className="w-6 h-6 text-violet-500 mb-1"/><p className="text-xs font-medium">{t.name}</p><p className="text-[10px] text-muted-foreground">{t.dimensions.w}×{t.dimensions.h}</p></div>
          ))}
        </div>
        <Button className="gap-2 w-full"><Palette className="w-4 h-4"/> Abrir Editor</Button>
      </CardContent>
    </Card>
  );
}

// #3 Chatbot
function ChatbotTab() {
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const msg = input; setInput(""); setMessages(p => [...p, {role: "user", text: msg}]); setLoading(true);
    try {
      const r = await postApi("/api/v2/chatbot/message", { message: msg, context: messages.slice(-5), brandName: "S2 Studio" });
      setMessages(p => [...p, {role: "bot", text: r.reply || "Sem resposta"}]);
      if (r.captureLead) toast.info("Lead capturado pelo chatbot!");
    } catch { toast.error("Erro"); } finally { setLoading(false); }
  }
  return (
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5 text-cyan-500"/> Chatbot de Atendimento IA</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/20 p-3 text-xs"><p className="font-semibold">🤖 Atendimento 24/7 com captura de leads</p><p className="text-muted-foreground mt-1">O bot responde, captura leads e agenda consultas automaticamente.</p></div>
        <div className="h-64 overflow-y-auto space-y-2 border rounded-lg p-3 bg-muted/30">
          {messages.length === 0 ? <p className="text-xs text-muted-foreground text-center mt-20">Envie uma mensagem para começar...</p> : messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[80%] rounded-lg p-2 text-xs ${m.role === "user" ? "bg-violet-500 text-white" : "bg-muted"}`}>{m.text}</div></div>
          ))}
          {loading && <div className="flex justify-start"><div className="bg-muted rounded-lg p-2"><Loader2 className="w-3 h-3 animate-spin"/></div></div>}
        </div>
        <div className="flex gap-2"><Input value={input} onChange={e => setInput(e.target.value)} placeholder="Digite sua mensagem..." onKeyDown={e => e.key === "Enter" && send()}/><Button onClick={send} disabled={loading}><Send className="w-4 h-4"/></Button></div>
      </CardContent>
    </Card>
  );
}

// #4 Email Marketing
function EmailTab() {
  const { data: templates } = useApi("/api/v2/email/templates");
  const [sending, setSending] = useState(false);
  async function send(t: any) { setSending(true); try { await postApi("/api/v2/email/send", { to: "cliente@email.com", subject: t.subject, template: t.id }); toast.success("E-mail enviado!"); } finally { setSending(false); } }
  return (
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5 text-blue-500"/> E-mail Marketing Automático</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3 text-xs"><p className="font-semibold">📧 Sequências automáticas disparadas por eventos</p></div>
        {templates?.templates?.map((t: any) => (
          <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border"><Mail className="w-4 h-4 text-blue-500"/><div className="flex-1"><p className="text-sm font-medium">{t.name}</p><p className="text-xs text-muted-foreground">Trigger: {t.trigger}</p></div><Button size="sm" variant="outline" disabled={sending} onClick={() => send(t)} className="text-xs">Enviar</Button></div>
        ))}
      </CardContent>
    </Card>
  );
}

// #5 Link in Bio
function LinkTreeTab() {
  const { data, loading } = useApi("/api/v2/linktree");
  if (loading) return <Skeleton className="h-64 rounded-xl"/>;
  return (
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><LinkIcon className="w-5 h-5 text-emerald-500"/> Link na Bio Inteligente</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center py-4"><div className="w-16 h-16 rounded-full bg-emerald-500 mx-auto mb-2 flex items-center justify-center text-white font-bold">S2</div><p className="font-semibold">{data?.profile?.name}</p><p className="text-xs text-muted-foreground">{data?.profile?.bio}</p><p className="text-xs text-emerald-500 font-bold mt-1">{data?.totalClicks} cliques totais</p></div>
        {data?.links?.map((l: any) => (
          <div key={l.id} className="flex items-center gap-3 p-3 rounded-lg border hover:border-emerald-500/40 cursor-pointer"><LinkIcon className="w-4 h-4 text-emerald-500"/><div className="flex-1"><p className="text-sm font-medium">{l.title}</p></div><Badge variant="secondary" className="text-[9px]">{l.clicks} cliques</Badge></div>
        ))}
        <Button className="gap-2 w-full"><QrCode className="w-4 h-4"/> Gerar QR Code</Button>
      </CardContent>
    </Card>
  );
}

// #6 ROI Dashboard
function RoiTab() {
  const { data, loading } = useApi("/api/v2/roi/dashboard");
  if (loading) return <Skeleton className="h-64 rounded-xl"/>;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{l:"ROI",v:`${data?.metrics?.roi}%`,i:TrendingUp,c:"text-emerald-500"},{l:"Receita",v:`R$ ${(data?.metrics?.totalRevenue/1000).toFixed(1)}k`,i:DollarSign,c:"text-blue-500"},{l:"Leads",v:data?.metrics?.leadsGenerated,i:Users,c:"text-violet-500"},{l:"CPA",v:`R$ ${data?.metrics?.cpa}`,i:Target,c:"text-amber-500"}].map(s => { const Icon = s.i; return (
          <Card key={s.l} className="p-3"><div className="flex items-center gap-2"><Icon className={`w-4 h-4 ${s.c}`}/><div><p className="text-lg font-bold">{s.v}</p><p className="text-[10px] text-muted-foreground">{s.l}</p></div></div></Card>
        );})}
      </div>
      <Card><CardHeader><CardTitle className="text-sm">Funil de Conversão</CardTitle></CardHeader><CardContent>
        <div className="space-y-2">{data?.funnel?.map((f: any, i: number) => (
          <div key={i}><div className="flex justify-between text-xs mb-1"><span>{f.stage}</span><span className="text-muted-foreground">{f.count} ({f.conversion}%)</span></div><div className="h-3 rounded-full bg-muted overflow-hidden"><div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{width: `${Math.max(f.conversion, 5)}%`}}/></div></div>
        ))}</div>
      </CardContent></Card>
    </div>
  );
}

// #7 Heatmap
function HeatmapTab() {
  const { data, loading } = useApi("/api/v2/heatmap");
  if (loading) return <Skeleton className="h-64 rounded-xl"/>;
  const getColor = (v: number) => v > 75 ? "bg-emerald-500" : v > 50 ? "bg-amber-500" : v > 25 ? "bg-orange-400" : "bg-rose-300";
  return (
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Grid3x3 className="w-5 h-5 text-orange-500"/> Heatmap de Engajamento</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-7 gap-1">{data?.days?.map((day: string, di: number) => (
          <div key={di} className="space-y-1"><p className="text-[10px] text-center text-muted-foreground">{day}</p>{data?.hours?.map((_: number, hi: number) => (
            <div key={hi} className={`aspect-square rounded ${getColor(data.grid[di][hi])} flex items-center justify-center text-[8px] text-white font-bold`} title={`${day} ${data.hours[hi]}h: ${data.grid[di][hi]}`}>{data.grid[di][hi]}</div>
          ))}</div>
        ))}</div>
        <div className="rounded-lg bg-orange-500/5 border border-orange-500/20 p-3"><p className="text-xs font-semibold mb-1">💡 Insights</p>{data?.insights?.map((ins: string, i: number) => <p key={i} className="text-xs text-muted-foreground">• {ins}</p>)}</div>
      </CardContent>
    </Card>
  );
}

// #8 A/B Testing
function ABTestTab() {
  const { data, loading } = useApi("/api/v2/ab-test/results");
  if (loading) return <Skeleton className="h-64 rounded-xl"/>;
  return (
    <div className="space-y-3">{data?.tests?.map((t: any) => (
      <Card key={t.id}><CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3"><GitBranch className="w-4 h-4 text-violet-500"/><p className="font-semibold text-sm">{t.name}</p><Badge className={t.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>{t.status}</Badge>{t.winner && <Badge variant="secondary" className="text-[9px]">Vencedor: {t.winner}</Badge>}</div>
        <div className="grid grid-cols-2 gap-3">
          {[{l:"A",d:t.variantA},{l:"B",d:t.variantB}].map(v => (
            <div key={v.l} className={`rounded-lg border p-3 ${t.winner === v.l ? "border-emerald-500 bg-emerald-50/50" : ""}`}><p className="text-xs font-bold mb-1">Variante {v.l}</p><p className="text-sm font-bold">{v.d.engagement}% engaj.</p><p className="text-xs text-muted-foreground">{v.d.likes} curtidas</p></div>
          ))}
        </div>
        <p className="text-xs text-emerald-600 font-medium mt-2">📈 +{t.improvement}% de melhoria</p>
      </CardContent></Card>
    ))}</div>
  );
}

// #9 Voice Clone
function VoiceTab() {
  const [training, setTraining] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [topic, setTopic] = useState("");
  const [generated, setGenerated] = useState<any>(null);
  async function handleTrain() {
    setTraining(true);
    try { const r = await postApi("/api/v2/voice-clone/train", { brandName: "S2 Studio", samplePosts: ["Excelente dica de hoje: sempre leia os contratos antes de assinar! ⚖️", "Você sabia que tem direito a descanso semanal remunerado? Saiba mais.", "Nova jurisprudência sobre direitos do consumidor foi publicada."] }); setProfile(r.voiceProfile); toast.success(`Voz treinada! Confiança: ${r.confidenceScore}%`); }
    catch { toast.error("Erro"); } finally { setTraining(false); }
  }
  async function handleGenerate() {
    if (!topic) return;
    try { const r = await postApi("/api/v2/voice-clone/generate", { topic, voiceProfile: profile }); setGenerated(r); toast.success("Conteúdo gerado!"); }
    catch { toast.error("Erro"); }
  }
  return (
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Mic className="w-5 h-5 text-rose-500"/> Clone de Voz da Marca</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleTrain} disabled={training} className="gap-2 w-full bg-gradient-to-r from-rose-500 to-pink-600">{training ? <Loader2 className="w-4 h-4 animate-spin"/> : <Mic className="w-4 h-4"/>} Treinar Voz da Marca</Button>
        {profile && <div className="rounded-lg border p-3"><p className="text-xs font-semibold mb-1">Perfil de Voz (Confiança: {profile.confidenceScore || 85}%)</p><div className="grid grid-cols-2 gap-2 text-xs">{Object.entries(profile).slice(0,4).map(([k,v]: any) => <div key={k}><span className="text-muted-foreground">{k}:</span> <span className="font-medium">{Array.isArray(v) ? v.slice(0,2).join(", ") : String(v)}</span></div>)}</div></div>}
        <Separator/>
        <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Tópico para gerar conteúdo no tom da marca"/>
        <Button onClick={handleGenerate} disabled={!profile} className="gap-2 w-full"><Sparkles className="w-4 h-4"/> Gerar com Voz da Marca</Button>
        {generated && <div className="rounded-lg border p-3 bg-muted/30"><p className="text-sm">{generated.caption}</p><div className="flex flex-wrap gap-1 mt-2">{generated.hashtags?.map((h: string, i: number) => <code key={i} className="text-[9px] px-1 py-0.5 rounded bg-muted">#{h}</code>)}</div></div>}
      </CardContent>
    </Card>
  );
}

// #10 Predictive AI
function PredictiveTab() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  async function handleAnalyze() {
    setLoading(true); setResult(null);
    try { const r = await postApi("/api/v2/predictive/recommendations", { niche: "Advocacia", historicalData: { posts: 50, avgEngagement: 4.2 } }); setResult(r); toast.success("Recomendações geradas!"); }
    catch { toast.error("Erro"); } finally { setLoading(false); }
  }
  return (
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Brain className="w-5 h-5 text-indigo-500"/> Recomendações Preditivas</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleAnalyze} disabled={loading} className="gap-2 w-full bg-gradient-to-r from-indigo-500 to-violet-600">{loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Brain className="w-4 h-4"/>} Analisar e Prever</Button>
        {result?.recommendations?.map((r: any, i: number) => (
          <div key={i} className="rounded-lg border p-3"><div className="flex items-center gap-2 mb-1"><Badge variant="secondary" className="text-[9px]">{r.type}</Badge><Badge className={r.confidence === "alta" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>{r.confidence}</Badge></div><p className="text-sm font-medium">{r.title}</p><p className="text-xs text-muted-foreground">{r.insight}</p><p className="text-xs text-indigo-500 mt-1">→ {r.action}</p></div>
        ))}
        {result?.predictions && <div className="rounded-lg bg-indigo-500/5 border border-indigo-500/20 p-3"><p className="text-xs font-semibold mb-1">🔮 Previsões</p><div className="grid grid-cols-2 gap-2 text-xs"><div><span className="text-muted-foreground">Melhor dia:</span> {result.predictions.bestDay}</div><div><span className="text-muted-foreground">Melhor hora:</span> {result.predictions.bestTime}</div><div><span className="text-muted-foreground">Trending:</span> {result.predictions.trendingTopic}</div></div></div>}
      </CardContent>
    </Card>
  );
}

// #11 Carousel Generator
function CarouselTab() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  async function handleGenerate() {
    if (!topic) return;
    setLoading(true); setResult(null);
    try { const r = await postApi("/api/v2/carousel/generate", { topic, slides: 5 }); setResult(r); toast.success("Carrossel gerado!"); }
    catch { toast.error("Erro"); } finally { setLoading(false); }
  }
  return (
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Layers className="w-5 h-5 text-cyan-500"/> Gerador de Carrossel</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Tópico do carrossel (ex: Direitos do Consumidor)"/>
        <Button onClick={handleGenerate} disabled={loading} className="gap-2 w-full bg-gradient-to-r from-cyan-500 to-blue-600">{loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Layers className="w-4 h-4"/>} Gerar Carrossel</Button>
        {result && <div className="space-y-2">{result.slides?.map((s: any, i: number) => (
          <div key={i} className="rounded-lg border p-3"><div className="flex items-center gap-2 mb-1"><div className="w-6 h-6 rounded-full bg-cyan-500 text-white text-xs flex items-center justify-center font-bold">{s.number}</div><p className="text-sm font-medium">{s.headline}</p></div><p className="text-xs text-muted-foreground">{s.body}</p>{s.visualHint && <p className="text-[10px] text-cyan-500 mt-1">🎨 {s.visualHint}</p>}</div>
        ))}</div>}
      </CardContent>
    </Card>
  );
}

// #12 Client Portal
function ClientTab() {
  const { data, loading } = useApi("/api/v2/client-portal/dashboard");
  if (loading) return <Skeleton className="h-64 rounded-xl"/>;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{l:"Publicados",v:data?.stats?.postsPublished,i:CheckCircle2},{l:"Agendados",v:data?.stats?.scheduledPosts,i:Clock},{l:"Aprovação",v:data?.stats?.pendingApproval,i:AlertTriangle},{l:"Engaj. Médio",v:`${data?.stats?.avgEngagement}%`,i:Heart}].map(s => { const Icon = s.i; return (
          <Card key={s.l} className="p-3"><Icon className="w-4 h-4 text-violet-500 mb-1"/><p className="text-lg font-bold">{s.v}</p><p className="text-[10px] text-muted-foreground">{s.l}</p></Card>
        );})}
      </div>
      {data?.pendingApprovals?.length > 0 && (
        <Card><CardHeader><CardTitle className="text-sm">Aprovações Pendentes</CardTitle></CardHeader><CardContent>
          {data.pendingApprovals.map((a: any) => (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border mb-2"><FileText className="w-4 h-4 text-amber-500"/><div className="flex-1"><p className="text-sm font-medium">{a.title}</p><p className="text-xs text-muted-foreground">{new Date(a.scheduledAt).toLocaleString("pt-BR")}</p></div><Button size="sm" variant="outline" className="text-xs text-emerald-600" onClick={async () => { await postApi("/api/v2/client-portal/approve", { postId: a.id, decision: "approved" }); toast.success("Aprovado!"); }}>Aprovar</Button><Button size="sm" variant="outline" className="text-xs text-rose-600" onClick={async () => { await postApi("/api/v2/client-portal/approve", { postId: a.id, decision: "rejected" }); toast.success("Rejeitado"); }}>Rejeitar</Button></div>
          ))}
        </CardContent></Card>
      )}
    </div>
  );
}

// #13 Finance
function FinanceTab() {
  const { data, loading } = useApi("/api/v2/finance/overview");
  if (loading) return <Skeleton className="h-64 rounded-xl"/>;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{l:"MRR",v:`R$ ${data?.mrr}`,i:DollarSign,c:"text-emerald-500"},{l:"Clientes",v:data?.clients,i:Users,c:"text-blue-500"},{l:"Lucro",v:`R$ ${data?.profit?.monthly}`,i:TrendingUp,c:"text-violet-500"},{l:"Margem",v:`${data?.profit?.margin}%`,i:Target,c:"text-amber-500"}].map(s => { const Icon = s.i; return (
          <Card key={s.l} className="p-3"><div className="flex items-center gap-2"><Icon className={`w-4 h-4 ${s.c}`}/><div><p className="text-lg font-bold">{s.v}</p><p className="text-[10px] text-muted-foreground">{s.l}</p></div></div></Card>
        );})}
      </div>
      <Card><CardHeader><CardTitle className="text-sm">Planos Ativos</CardTitle></CardHeader><CardContent>{data?.plans?.map((p: any) => (
        <div key={p.name} className="flex items-center gap-3 p-2 rounded-lg border mb-1"><div className="flex-1"><p className="text-sm font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.clients} cliente(s) • R$ {p.price}/mês</p></div><Badge variant="secondary">R$ {p.mrr}/mês</Badge></div>
      ))}</CardContent></Card>
    </div>
  );
}

// #14 Push Notifications
function PushTab() {
  const { data } = useApi("/api/v2/push/history");
  return (
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5 text-amber-500"/> Push Notifications</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 text-xs"><p className="font-semibold">📱 Notificações no celular</p><p className="text-muted-foreground mt-1">Receba alertas de publicação, aprovações e menções negativas em tempo real.</p></div>
        <Button className="gap-2 w-full" onClick={async () => { await postApi("/api/v2/push/register", { token: "demo-token", platform: "web" }); toast.success("Dispositivo registrado!"); }}><Smartphone className="w-4 h-4"/> Registrar Dispositivo</Button>
        <div className="space-y-2">{data?.notifications?.map((n: any) => (
          <div key={n.id} className={`flex items-start gap-2 p-3 rounded-lg border ${!n.read ? "border-amber-500/40 bg-amber-50/30" : ""}`}><Bell className="w-4 h-4 text-amber-500 shrink-0 mt-0.5"/><div className="flex-1"><p className="text-xs font-medium">{n.title}</p><p className="text-xs text-muted-foreground">{n.body}</p><p className="text-[10px] text-muted-foreground mt-1">{new Date(n.timestamp).toLocaleString("pt-BR")}</p></div>{!n.read && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1"/>}</div>
        ))}</div>
      </CardContent>
    </Card>
  );
}

// #15 Calendar Sync
function CalendarTab() {
  const { data, loading } = useApi("/api/v2/calendar/sync");
  if (loading) return <Skeleton className="h-64 rounded-xl"/>;
  return (
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><CalIcon className="w-5 h-5 text-blue-500"/> Integração com Calendário</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {!data?.calendarConnected && <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3 text-xs"><p className="font-semibold">📅 Conecte seu calendário</p><p className="text-muted-foreground mt-1">Sincronize agendamentos de posts com Google Calendar ou Outlook.</p></div>}
        <div className="flex gap-2"><Button variant="outline" className="gap-2 flex-1" onClick={async () => { const r = await postApi("/api/v2/calendar/connect", { provider: "google" }); if (r.authUrl) window.open(r.authUrl); }}>Google Calendar</Button><Button variant="outline" className="gap-2 flex-1" onClick={async () => { const r = await postApi("/api/v2/calendar/connect", { provider: "outlook" }); if (r.authUrl) window.open(r.authUrl); }}>Outlook</Button></div>
        <Separator/>
        <div className="space-y-2">{data?.events?.map((e: any) => (
          <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg border"><CalIcon className="w-4 h-4 text-blue-500 shrink-0"/><div className="flex-1"><p className="text-sm font-medium">{e.title}</p><p className="text-xs text-muted-foreground">{new Date(e.start).toLocaleString("pt-BR", {day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</p></div></div>
        ))}</div>
      </CardContent>
    </Card>
  );
}

// #16 LGPD
function LgpdTab() {
  const { data, loading } = useApi("/api/v2/lgpd/audit");
  if (loading) return <Skeleton className="h-64 rounded-xl"/>;
  const statusMeta: any = { conforme: {c:"bg-emerald-100 text-emerald-700",i:CheckCircle2}, parcial: {c:"bg-amber-100 text-amber-700",i:AlertTriangle}, nao_implementado: {c:"bg-rose-100 text-rose-700",i:AlertTriangle} };
  return (
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-red-500"/> LGPD Compliance</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted"><div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg" style={{color: data?.compliance?.score > 75 ? "#10B981" : "#F59E0B"}}>{data?.compliance?.score}%</div><div><p className="text-sm font-semibold">{data?.compliance?.status}</p><p className="text-xs text-muted-foreground">Última auditoria: {data?.compliance?.lastAudit}</p></div></div>
        <div className="space-y-1">{data?.checks?.map((c: any, i: number) => {
          const sm = statusMeta[c.status] || statusMeta.parcial;
          const Icon = sm.i;
          return <div key={i} className="flex items-center gap-2 p-2 rounded-lg border"><Icon className={`w-4 h-4 ${sm.c.split(" ")[1]}`} /><div className="flex-1"><p className="text-xs font-medium">{c.item}</p><p className="text-[10px] text-muted-foreground">{c.description}</p></div><Badge className={`text-[9px] ${sm.c}`}>{c.status}</Badge></div>;
        })}</div>
      </CardContent>
    </Card>
  );
}

// #17 Backup
function BackupTab() {
  const { data, loading } = useApi("/api/v2/backup/status");
  if (loading) return <Skeleton className="h-64 rounded-xl"/>;
  return (
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Database className="w-5 h-5 text-indigo-500"/> Backup Automático</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Último backup</p><p className="text-sm font-bold">{data?.lastBackup ? new Date(data.lastBackup).toLocaleDateString("pt-BR") : "—"}</p></div><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Próximo</p><p className="text-sm font-bold">{data?.nextBackup ? new Date(data.nextBackup).toLocaleDateString("pt-BR") : "—"}</p></div><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Tamanho</p><p className="text-sm font-bold">{data?.totalSize}</p></div></div>
        <div className="flex gap-2"><Button variant="outline" className="gap-2 flex-1" onClick={async () => { await postApi("/api/v2/backup/create", {}); toast.success("Backup iniciado!"); }}><Database className="w-4 h-4"/> Backup Agora</Button><Button variant="outline" className="gap-2 flex-1" onClick={async () => { const r = await postApi("/api/v2/backup/export", {}); toast.success(r.message); }}><Download className="w-4 h-4"/> Exportar</Button></div>
        <Separator/>
        <div className="space-y-1">{data?.backups?.map((b: any) => (
          <div key={b.id} className="flex items-center gap-3 p-2 rounded-lg border"><Database className="w-4 h-4 text-indigo-500"/><div className="flex-1"><p className="text-xs font-medium">{new Date(b.date).toLocaleDateString("pt-BR")}</p><p className="text-[10px] text-muted-foreground">{b.size} • {b.type}</p></div><CheckCircle2 className="w-4 h-4 text-emerald-500"/></div>
        ))}</div>
      </CardContent>
    </Card>
  );
}
