import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import type { ContentPost } from "../../../drizzle/schema";

const AssetLibrary = lazy(() => import("./AssetLibrary"));
const ArtworkStudio = lazy(() => import("./ArtworkStudio"));
const AutomationCenter = lazy(() => import("./AutomationCenter"));
const BrandWorkspacePanel = lazy(() => import("./BrandWorkspacePanel"));
const ContentDeskV4 = lazy(() => import("./EditorialTools").then(module => ({ default: module.ContentDeskV4 })));
const StrategyBoardV2 = lazy(() => import("./EditorialTools").then(module => ({ default: module.StrategyBoardV2 })));
const GrowthWorkspace = lazy(() => import("./GrowthWorkspace"));
const KnowledgePanel = lazy(() => import("./KnowledgePanel"));
const MarketingRoadmap = lazy(() => import("./MarketingRoadmap"));
const NetworkHub = lazy(() => import("./NetworkHub"));
const NewsRadar = lazy(() => import("./NewsRadar"));
const SaasOverview = lazy(() => import("./SaasOverview"));
const SocialOsCommandCenter = lazy(() => import("./SocialOsCommandCenter"));
const BrandPanel = lazy(() => import("./StudioPanels").then(module => ({ default: module.BrandPanel })));
const CalendarPanel = lazy(() => import("./StudioPanels").then(module => ({ default: module.CalendarPanel })));
const SourcesPanel = lazy(() => import("./StudioPanels").then(module => ({ default: module.SourcesPanel })));

function mutationError(error: { message: string }) {
  toast.error(error.message || "Não foi possível concluir a operação.");
}

const socialOsLocations = new Set(["/command-center", "/inteligencia", "/inbox", "/leads", "/concorrencia", "/analytics", "/compliance"]);
const growthLocations = new Set(["/video", "/seo", "/ads", "/relatorios", "/agentes", "/memoria", "/governanca"]);

export default function Home() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const dataQuery = trpc.socialStudio.data.useQuery(undefined, { enabled: Boolean(user), staleTime: 30_000 });
  const workspacesQuery = trpc.brandWorkspaces.list.useQuery(undefined, { enabled: Boolean(user), staleTime: 30_000 });
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

  const data = dataQuery.data;
  const defaultWorkspace = useMemo(() => workspacesQuery.data?.find(workspace => workspace.isDefault && workspace.status === "active") ?? null, [workspacesQuery.data]);
  const defaultWorkspaceId = defaultWorkspace?.id ?? null;
  const workspacePostIdsQuery = trpc.brandWorkspaces.postIds.useQuery(
    { brandWorkspaceId: defaultWorkspaceId ?? 0 },
    { enabled: Boolean(defaultWorkspaceId), staleTime: 30_000 },
  );
  const workspacePostIds = useMemo(() => new Set(workspacePostIdsQuery.data ?? []), [workspacePostIdsQuery.data]);
  const visiblePosts = useMemo(() => {
    if (!defaultWorkspaceId || workspacePostIdsQuery.data === undefined) return [];
    return (data?.posts ?? []).filter(post => workspacePostIds.has(post.id));
  }, [data?.posts, defaultWorkspaceId, workspacePostIds, workspacePostIdsQuery.data]);
  const activeBrandContext = defaultWorkspace
    ? { brandName: defaultWorkspace.name, prohibitedTerms: defaultWorkspace.prohibitedTerms }
    : null;

  useEffect(() => {
    if (!selectedTopicId && data?.topics?.length) setSelectedTopicId(data.topics[0].id);
  }, [data?.topics?.length, selectedTopicId]);

  useEffect(() => {
    const selectedStillVisible = selectedPostId != null && visiblePosts.some(post => post.id === selectedPostId);
    if (!selectedStillVisible) setSelectedPostId(visiblePosts[0]?.id ?? null);
  }, [visiblePosts, selectedPostId, defaultWorkspaceId]);

  const refresh = async () => { await utils.socialStudio.data.invalidate(); };
  const refreshEditorial = async () => {
    await Promise.all([
      utils.socialStudio.data.invalidate(),
      defaultWorkspaceId ? utils.brandWorkspaces.postIds.invalidate({ brandWorkspaceId: defaultWorkspaceId }) : Promise.resolve(),
    ]);
  };
  const generate = trpc.brandWorkspaces.generateDraft.useMutation({
    onSuccess: async post => {
      await refreshEditorial();
      setSelectedPostId(post.id);
      toast.success(`Rascunho criado em ${defaultWorkspace?.name ?? "marca ativa"}.`);
    },
    onError: mutationError,
  });
  const updatePost = trpc.socialGovernance.updatePost.useMutation({ onSuccess: async post => { setSelectedPostId(post.id); await refresh(); toast.success(post.status === "draft" ? "Conteúdo salvo; aprovação anterior foi invalidada quando necessário." : "Conteúdo salvo."); }, onError: mutationError });
  const sendReview = trpc.brandWorkspaces.sendToReview.useMutation({ onSuccess: async post => { setSelectedPostId(post.id); await refresh(); toast.success("Enviado para revisão com as regras da marca vinculada."); }, onError: mutationError });
  const decide = trpc.socialGovernance.decide.useMutation({ onSuccess: async post => { setSelectedPostId(post.id); await refresh(); toast.success("Decisão vinculada à versão atual do conteúdo."); }, onError: mutationError });
  const schedule = trpc.socialGovernance.schedule.useMutation({ onSuccess: async post => { setSelectedPostId(post.id); await refresh(); toast.success("Agendamento registrado com aprovação válida."); }, onError: mutationError });
  const addSource = trpc.socialStudio.addSource.useMutation({ onSuccess: async () => { await refresh(); toast.success("Fonte cadastrada."); }, onError: mutationError });
  const addKnowledge = trpc.socialStudio.addKnowledge.useMutation({ onSuccess: async () => { await refresh(); toast.success("Referência cadastrada."); }, onError: mutationError });
  const uploadKnowledge = trpc.knowledgeSecurity.upload.useMutation({ onSuccess: async () => { await refresh(); toast.success("Documento validado e armazenado com segurança."); }, onError: mutationError });
  const updateBrand = trpc.socialStudio.updateBrand.useMutation({
    onSuccess: async () => {
      await Promise.all([refresh(), utils.brandWorkspaces.list.invalidate()]);
      toast.success("Brand OS legado atualizado.");
    },
    onError: mutationError,
  });
  type AddKnowledgeInput = Parameters<typeof addKnowledge.mutate>[0];
  type UploadKnowledgeInput = Parameters<typeof uploadKnowledge.mutate>[0];
  type AddSourceInput = Parameters<typeof addSource.mutate>[0];
  type UpdateBrandInput = Parameters<typeof updateBrand.mutate>[0];
  type GenerateDraftInput = Omit<Parameters<typeof generate.mutate>[0], "brandWorkspaceId">;
  type UpdatePostInput = Parameters<typeof updatePost.mutate>[0];

  const selectedPost = useMemo(() => visiblePosts.find(post => post.id === selectedPostId) ?? null, [visiblePosts, selectedPostId]);
  const counts = useMemo(() => {
    const result: Record<ContentPost["status"], number> = { draft: 0, review: 0, approved: 0, scheduled: 0, published: 0, rejected: 0 };
    for (const post of visiblePosts) result[post.status] = (result[post.status] ?? 0) + 1;
    return result;
  }, [visiblePosts]);

  const generateForDefaultWorkspace = (value: GenerateDraftInput) => {
    if (!defaultWorkspaceId) {
      toast.error("Defina uma marca padrão ativa antes de gerar conteúdo.");
      setLocation("/marcas");
      return;
    }
    generate.mutate({ ...value, brandWorkspaceId: defaultWorkspaceId });
  };

  const loadingEditorialContext = workspacesQuery.isLoading || Boolean(defaultWorkspaceId && workspacePostIdsQuery.isLoading);
  let content: React.ReactNode;
  if (!user || dataQuery.isLoading || loadingEditorialContext) {
    content = <div className="saas-card flex min-h-[420px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#c59b5a]" /></div>;
  } else if (dataQuery.isError || workspacesQuery.isError || workspacePostIdsQuery.isError || !data) {
    content = <div className="saas-card p-6 text-sm text-rose-300">{dataQuery.error?.message ?? workspacesQuery.error?.message ?? workspacePostIdsQuery.error?.message ?? "Não foi possível carregar o Social OS."}</div>;
  } else if (growthLocations.has(location)) {
    content = <GrowthWorkspace />;
  } else if (socialOsLocations.has(location)) {
    content = <SocialOsCommandCenter />;
  } else if (location === "/radar") {
    content = <NewsRadar />;
  } else if (location === "/automacao") {
    content = <AutomationCenter settings={data.automation} />;
  } else if (location === "/redes" || location === "/instagram") {
    content = <NetworkHub />;
  } else if (location === "/biblioteca") {
    content = <AssetLibrary assets={data.assets} />;
  } else if (location === "/conhecimento") {
    content = <KnowledgePanel materials={data.knowledge} onAdd={(value: AddKnowledgeInput) => addKnowledge.mutate(value)} adding={addKnowledge.isPending} onUpload={(value: UploadKnowledgeInput) => uploadKnowledge.mutate(value)} uploading={uploadKnowledge.isPending} />;
  } else if (location === "/fontes") {
    content = <SourcesPanel sources={data.sources} onAdd={(value: AddSourceInput) => addSource.mutate(value)} adding={addSource.isPending} />;
  } else if (location === "/marcas") {
    content = <BrandWorkspacePanel />;
  } else if (location === "/marca") {
    content = <BrandPanel brand={data.brand} onSave={(value: UpdateBrandInput) => updateBrand.mutate(value)} saving={updateBrand.isPending} />;
  } else if (location === "/roadmap") {
    content = <MarketingRoadmap />;
  } else if (location === "/planejamento") {
    content = <StrategyBoardV2 topics={data.topics} onUseTopic={(id: number) => { setSelectedTopicId(id); setLocation("/conteudos"); }} />;
  } else if (location === "/calendario") {
    content = <CalendarPanel posts={visiblePosts} />;
  } else if (location === "/conteudos") {
    content = <div className="space-y-6">
      <ContentDeskV4 topics={data.topics} sources={data.sources} brand={activeBrandContext} posts={visiblePosts} selectedPost={selectedPost} selectedTopicId={selectedTopicId} onSelectTopic={(id: number) => setSelectedTopicId(id)} onSelectPost={(id: number) => setSelectedPostId(id)} onGenerate={generateForDefaultWorkspace} generating={generate.isPending || loadingEditorialContext} onUpdate={(value: UpdatePostInput) => updatePost.mutate(value)} saving={updatePost.isPending} onSendReview={(id: number) => sendReview.mutate({ id })} onDecide={(id: number, decision: "approved" | "rejected" | "changes_requested", notes?: string) => decide.mutate({ id, decision, notes: notes || undefined })} onSchedule={(id: number, scheduledAt: Date) => schedule.mutate({ id, scheduledAt })} />
      {selectedPost && <ArtworkStudio key={selectedPost.id} post={selectedPost} />}
    </div>;
  } else {
    content = <SaasOverview data={{ posts: visiblePosts }} counts={counts} brandName={defaultWorkspace?.name ?? null} brandKey={defaultWorkspace?.key ?? null} onCreate={() => setLocation("/conteudos")} onOpenCalendar={() => setLocation("/calendario")} onOpenRadar={() => setLocation("/radar")} onOpenAutomation={() => setLocation("/automacao")} onOpenNetworks={() => setLocation("/redes")} />;
  }

  return <DashboardLayout><div className="saas-shell mx-auto w-full max-w-[1680px]"><Suspense fallback={<div className="saas-card flex min-h-[420px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#c59b5a]" /></div>}>{content}</Suspense></div></DashboardLayout>;
}
