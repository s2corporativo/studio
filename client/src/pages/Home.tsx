import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import AssetLibrary from "./AssetLibrary";
import ArtworkStudio from "./ArtworkStudio";
import AutomationCenter from "./AutomationCenter";
import { ContentDeskV4, StrategyBoardV2 } from "./EditorialTools";
import KnowledgePanel from "./KnowledgePanel";
import MarketingRoadmap from "./MarketingRoadmap";
import NetworkHub from "./NetworkHub";
import NewsRadar from "./NewsRadar";
import SaasOverview from "./SaasOverview";
import SocialOsCommandCenter from "./SocialOsCommandCenter";
import { BrandPanel, CalendarPanel, SourcesPanel } from "./StudioPanels";

function mutationError(error: { message: string }) {
  toast.error(error.message || "Não foi possível concluir a operação.");
}

const socialOsLocations = new Set(["/command-center", "/inteligencia", "/inbox", "/leads", "/concorrencia", "/analytics", "/compliance"]);

export default function Home() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const dataQuery = trpc.socialStudio.data.useQuery(undefined, { enabled: Boolean(user), staleTime: 30_000 });
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

  const data = dataQuery.data;
  useEffect(() => {
    if (!selectedTopicId && data?.topics?.length) setSelectedTopicId(data.topics[0].id);
    if (!selectedPostId && data?.posts?.length) setSelectedPostId(data.posts[0].id);
  }, [data?.topics?.length, data?.posts?.length, selectedTopicId, selectedPostId]);

  const refresh = async () => { await utils.socialStudio.data.invalidate(); };
  const generate = trpc.socialStudio.generateDraft.useMutation({ onSuccess: async post => { setSelectedPostId(post.id); await refresh(); toast.success("Rascunho criado."); }, onError: mutationError });
  const updatePost = trpc.socialGovernance.updatePost.useMutation({ onSuccess: async post => { setSelectedPostId(post.id); await refresh(); toast.success(post.status === "draft" ? "Conteúdo salvo; aprovação anterior foi invalidada quando necessário." : "Conteúdo salvo."); }, onError: mutationError });
  const sendReview = trpc.socialStudio.sendToReview.useMutation({ onSuccess: async post => { setSelectedPostId(post.id); await refresh(); toast.success("Enviado para revisão."); }, onError: mutationError });
  const decide = trpc.socialGovernance.decide.useMutation({ onSuccess: async post => { setSelectedPostId(post.id); await refresh(); toast.success("Decisão vinculada à versão atual do conteúdo."); }, onError: mutationError });
  const schedule = trpc.socialGovernance.schedule.useMutation({ onSuccess: async post => { setSelectedPostId(post.id); await refresh(); toast.success("Agendamento registrado com aprovação válida."); }, onError: mutationError });
  const addSource = trpc.socialStudio.addSource.useMutation({ onSuccess: async () => { await refresh(); toast.success("Fonte cadastrada."); }, onError: mutationError });
  const addKnowledge = trpc.socialStudio.addKnowledge.useMutation({ onSuccess: async () => { await refresh(); toast.success("Referência cadastrada."); }, onError: mutationError });
  const uploadKnowledge = trpc.socialStudio.uploadKnowledge.useMutation({ onSuccess: async () => { await refresh(); toast.success("Documento armazenado."); }, onError: mutationError });
  const updateBrand = trpc.socialStudio.updateBrand.useMutation({ onSuccess: async () => { await refresh(); toast.success("Brand OS atualizado."); }, onError: mutationError });

  const selectedPost = useMemo(() => data?.posts?.find(post => post.id === selectedPostId) ?? null, [data?.posts, selectedPostId]);
  const counts = useMemo(() => {
    const result = { draft: 0, review: 0, approved: 0, scheduled: 0, published: 0, rejected: 0 } as Record<string, number>;
    for (const post of data?.posts ?? []) result[post.status] = (result[post.status] ?? 0) + 1;
    return result;
  }, [data?.posts]);

  let content: React.ReactNode;
  if (!user || dataQuery.isLoading) {
    content = <div className="saas-card flex min-h-[420px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-violet-300" /></div>;
  } else if (dataQuery.isError || !data) {
    content = <div className="saas-card p-6 text-sm text-rose-300">{dataQuery.error?.message ?? "Não foi possível carregar o Social OS."}</div>;
  } else if (socialOsLocations.has(location)) {
    content = <SocialOsCommandCenter />;
  } else if (location === "/radar") {
    content = <NewsRadar />;
  } else if (location === "/automacao") {
    content = <AutomationCenter settings={data.automation} />;
  } else if (location === "/redes" || location === "/instagram") {
    content = <NetworkHub />;
  } else if (location === "/biblioteca") {
    content = <AssetLibrary assets={data.assets as any} />;
  } else if (location === "/conhecimento") {
    content = <KnowledgePanel materials={data.knowledge} onAdd={(value: any) => addKnowledge.mutate(value)} adding={addKnowledge.isPending} onUpload={(value: any) => uploadKnowledge.mutate(value)} uploading={uploadKnowledge.isPending} />;
  } else if (location === "/fontes") {
    content = <SourcesPanel sources={data.sources} onAdd={(value: any) => addSource.mutate(value)} adding={addSource.isPending} />;
  } else if (location === "/marca") {
    content = <BrandPanel brand={data.brand} onSave={(value: any) => updateBrand.mutate(value)} saving={updateBrand.isPending} />;
  } else if (location === "/roadmap") {
    content = <MarketingRoadmap />;
  } else if (location === "/planejamento") {
    content = <StrategyBoardV2 topics={data.topics} onUseTopic={(id: number) => { setSelectedTopicId(id); setLocation("/conteudos"); }} />;
  } else if (location === "/calendario") {
    content = <CalendarPanel posts={data.posts} />;
  } else if (location === "/conteudos") {
    content = <div className="space-y-6">
      <ContentDeskV4
        topics={data.topics}
        sources={data.sources}
        brand={data.brand}
        posts={data.posts}
        selectedPost={selectedPost}
        selectedTopicId={selectedTopicId}
        onSelectTopic={(id: number) => setSelectedTopicId(id)}
        onSelectPost={(id: number) => setSelectedPostId(id)}
        onGenerate={(value: any) => generate.mutate(value)}
        generating={generate.isPending}
        onUpdate={(value: any) => updatePost.mutate(value)}
        saving={updatePost.isPending}
        onSendReview={(id: number) => sendReview.mutate({ id })}
        onDecide={(id: number, decision: "approved" | "rejected" | "changes_requested", notes?: string) => decide.mutate({ id, decision, notes: notes || undefined })}
        onSchedule={(id: number, scheduledAt: Date) => schedule.mutate({ id, scheduledAt })}
      />
      {selectedPost && <ArtworkStudio key={selectedPost.id} post={selectedPost} />}
    </div>;
  } else {
    content = <SaasOverview data={data} counts={counts} onCreate={() => setLocation("/conteudos")} onOpenCalendar={() => setLocation("/calendario")} onOpenRadar={() => setLocation("/radar")} onOpenAutomation={() => setLocation("/automacao")} onOpenNetworks={() => setLocation("/redes")} />;
  }

  return <DashboardLayout><div className="saas-shell mx-auto w-full max-w-[1680px]">{content}</div></DashboardLayout>;
}
