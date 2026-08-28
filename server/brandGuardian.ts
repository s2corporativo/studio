import { invokeLLM, listLLMModels, type MessageContent } from "./_core/llm";
import { addCreativeEvaluation, recordAuditEvent } from "./socialOsDb";
import { addComplianceCheck } from "./socialGrowthDb";
import { getPostMedia, getStudioData, getStudioPost } from "./socialStudioDb";

const scoreProperty = { type: "integer", minimum: 0, maximum: 100 } as const;

export async function evaluatePostCreative(userId: number, postId: number, mediaId?: number | null) {
  const [post, media, studio] = await Promise.all([
    getStudioPost(userId, postId),
    getPostMedia(userId, postId),
    getStudioData(userId),
  ]);
  const assets = mediaId ? media.filter(item => item.id === mediaId) : media.slice(0, 10);
  if (!assets.length) throw new Error("Adicione uma imagem ao post antes de executar o Brand Guardian.");
  if (assets.some(asset => !/^https:\/\//i.test(asset.url))) throw new Error("O Brand Guardian exige URLs HTTPS acessíveis para analisar as imagens.");

  const catalog = await listLLMModels();
  const model = catalog.data.find(item => item.id === "gpt-5-mini")?.id ?? catalog.data[0]?.id;
  const userContent: MessageContent[] = [
    {
      type: "text",
      text: `Marca: ${studio.brand?.brandName ?? "não definida"}\nDiretrizes visuais: ${studio.brand?.visualGuidelines ?? "não definidas"}\nTom: ${studio.brand?.toneOfVoice ?? "profissional"}\nTermos proibidos: ${studio.brand?.prohibitedTerms ?? "promessas de resultado e sensacionalismo"}\nTítulo do post: ${post.title}\nGancho: ${post.hook ?? ""}\nLegenda: ${post.caption ?? ""}\nCTA: ${post.cta ?? ""}\nAlt text: ${post.altText ?? ""}\nQuantidade de peças: ${assets.length}. As imagens seguintes estão na ordem do carrossel. Avalie o conjunto completo e considere como resultado geral o pior problema relevante encontrado em qualquer peça. Em carrosséis, verifique também consistência visual entre páginas.`,
    },
    ...assets.map(asset => ({ type: "image_url" as const, image_url: { url: asset.url, detail: "high" as const } })),
  ];

  const response = await invokeLLM({
    model,
    maxCompletionTokens: 2200,
    reasoning: { effort: "minimal" },
    messages: [
      {
        role: "system",
        content: "Você é Brand Guardian e diretor de arte para comunicação institucional e publicidade jurídica brasileira. Avalie somente o que é visível nas imagens e o contexto textual fornecido. Não invente elementos. Penalize baixa legibilidade, poluição visual, tipografia inconsistente, inconsistência entre páginas, aparência evidente de IA, rostos/mãos deformados, logotipo incorreto, texto potencialmente enganoso, promessa de resultado, sensacionalismo, chamada mercantilista e desvio da identidade visual. Para um carrossel, um problema grave em qualquer página deve afetar a aprovação do conjunto. Retorne somente JSON válido.",
      },
      { role: "user", content: userContent },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "brand_guardian_review",
        strict: true,
        schema: {
          type: "object",
          properties: {
            visualQuality: scoreProperty,
            brandFit: scoreProperty,
            legibility: scoreProperty,
            attentionPotential: scoreProperty,
            aiAppearanceRisk: scoreProperty,
            legalAdvertisingRisk: scoreProperty,
            consistencyScore: scoreProperty,
            passed: { type: "boolean" },
            findings: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            summary: { type: "string" },
          },
          required: ["visualQuality", "brandFit", "legibility", "attentionPotential", "aiAppearanceRisk", "legalAdvertisingRisk", "consistencyScore", "passed", "findings", "recommendations", "summary"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("O Brand Guardian não retornou avaliação estruturada.");
  const review = JSON.parse(content) as {
    visualQuality: number;
    brandFit: number;
    legibility: number;
    attentionPotential: number;
    aiAppearanceRisk: number;
    legalAdvertisingRisk: number;
    consistencyScore: number;
    passed: boolean;
    findings: string[];
    recommendations: string[];
    summary: string;
  };

  const conservativePass = review.passed && review.visualQuality >= 70 && review.brandFit >= 70 && review.legibility >= 70 && review.consistencyScore >= 70 && review.aiAppearanceRisk <= 35 && review.legalAdvertisingRisk <= 25;
  const notes = `${review.summary}\nAchados: ${review.findings.join(" | ")}\nRecomendações: ${review.recommendations.join(" | ")}`.slice(0, 5000);
  const evaluationIds: number[] = [];
  for (const asset of assets) {
    const evaluation = await addCreativeEvaluation(userId, {
      postId,
      mediaUrl: asset.url,
      visualQuality: review.visualQuality,
      brandFit: review.brandFit,
      legibility: review.legibility,
      attentionPotential: review.attentionPotential,
      aiAppearanceRisk: review.aiAppearanceRisk,
      notes,
      passed: conservativePass,
    });
    evaluationIds.push(evaluation.id);
  }
  await addComplianceCheck(userId, {
    postId,
    adPlanId: null,
    checkType: "brand_safety",
    result: conservativePass ? "passed" : review.legalAdvertisingRisk > 50 ? "blocked" : "needs_human",
    findingsJson: JSON.stringify({ ...review, conservativePass, mediaIds: assets.map(asset => asset.id), mediaUrls: assets.map(asset => asset.url) }),
    checkedBy: "system",
  });
  await recordAuditEvent(userId, "brand_guardian.evaluated", "content_post", postId, { mediaIds: assets.map(asset => asset.id), conservativePass, legalAdvertisingRisk: review.legalAdvertisingRisk, consistencyScore: review.consistencyScore });
  return { ...review, passed: conservativePass, evaluationIds, mediaIds: assets.map(asset => asset.id) };
}
