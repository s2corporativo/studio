import { invokeLLM, listLLMModels } from "./_core/llm";
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
  const asset = mediaId ? media.find(item => item.id === mediaId) : media[0];
  if (!asset) throw new Error("Adicione uma imagem ao post antes de executar o Brand Guardian.");
  if (!/^https:\/\//i.test(asset.url)) throw new Error("O Brand Guardian exige uma URL HTTPS acessível para analisar a imagem.");

  const catalog = await listLLMModels();
  const model = catalog.data.find(item => item.id === "gpt-5-mini")?.id ?? catalog.data[0]?.id;
  const response = await invokeLLM({
    model,
    maxCompletionTokens: 1800,
    reasoning: { effort: "minimal" },
    messages: [
      {
        role: "system",
        content: "Você é Brand Guardian e diretor de arte para comunicação institucional e publicidade jurídica brasileira. Avalie somente o que é visível na imagem e o contexto textual fornecido. Não invente elementos. Penalize baixa legibilidade, poluição visual, tipografia inconsistente, aparência evidente de IA, rostos/mãos deformados, logotipo incorreto, texto potencialmente enganoso, promessa de resultado, sensacionalismo, chamada mercantilista e desvio da identidade visual. Retorne somente JSON válido.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Marca: ${studio.brand?.brandName ?? "não definida"}\nDiretrizes visuais: ${studio.brand?.visualGuidelines ?? "não definidas"}\nTom: ${studio.brand?.toneOfVoice ?? "profissional"}\nTermos proibidos: ${studio.brand?.prohibitedTerms ?? "promessas de resultado e sensacionalismo"}\nTítulo do post: ${post.title}\nGancho: ${post.hook ?? ""}\nLegenda: ${post.caption ?? ""}\nCTA: ${post.cta ?? ""}\nAlt text: ${post.altText ?? ""}\nAvalie a peça visual para uso institucional.`,
          },
          { type: "image_url", image_url: { url: asset.url, detail: "high" } },
        ],
      },
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
            passed: { type: "boolean" },
            findings: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            summary: { type: "string" },
          },
          required: ["visualQuality", "brandFit", "legibility", "attentionPotential", "aiAppearanceRisk", "legalAdvertisingRisk", "passed", "findings", "recommendations", "summary"],
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
    passed: boolean;
    findings: string[];
    recommendations: string[];
    summary: string;
  };

  const conservativePass = review.passed && review.visualQuality >= 70 && review.brandFit >= 70 && review.legibility >= 70 && review.aiAppearanceRisk <= 35 && review.legalAdvertisingRisk <= 25;
  const notes = `${review.summary}\nAchados: ${review.findings.join(" | ")}\nRecomendações: ${review.recommendations.join(" | ")}`.slice(0, 5000);
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
  await addComplianceCheck(userId, {
    postId,
    adPlanId: null,
    checkType: "brand_safety",
    result: conservativePass ? "passed" : review.legalAdvertisingRisk > 50 ? "blocked" : "needs_human",
    findingsJson: JSON.stringify({ ...review, conservativePass, mediaId: asset.id, mediaUrl: asset.url }),
    checkedBy: "system",
  });
  await recordAuditEvent(userId, "brand_guardian.evaluated", "content_post", postId, { mediaId: asset.id, conservativePass, legalAdvertisingRisk: review.legalAdvertisingRisk });
  return { ...review, passed: conservativePass, evaluationId: evaluation.id, mediaId: asset.id };
}
