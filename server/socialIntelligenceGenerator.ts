import { invokeLLM, listLLMModels } from "./_core/llm";

async function modelId() {
  const catalog = await listLLMModels();
  return catalog.data.find(item => item.id === "gpt-5-mini")?.id ?? catalog.data[0]?.id;
}

async function invokeJson<T>(name: string, system: string, user: string, schema: Record<string, unknown>, maxCompletionTokens = 1800) {
  const response = await invokeLLM({
    model: await modelId(),
    maxCompletionTokens,
    reasoning: { effort: "minimal" },
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
    response_format: { type: "json_schema", json_schema: { name, strict: true, schema } },
  });
  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("A IA não retornou uma resposta estruturada.");
  return JSON.parse(content) as T;
}

const scoreProperty = { type: "integer", minimum: 0, maximum: 100 } as const;

export async function assessContentOpportunity(input: {
  title: string;
  summary?: string | null;
  source: string;
  sourceUrl: string;
  publishedAt?: string | null;
  area: string;
  officialSourceScore: number;
  preferredAreas?: string | null;
  targetAudience?: string | null;
}) {
  return invokeJson<{
    relevanceScore: number;
    freshnessScore: number;
    authorityScore: number;
    commercialScore: number;
    riskScore: number;
    totalScore: number;
    rationale: string;
    recommendedFormat: "post" | "carousel" | "reel" | "story";
  }>(
    "content_opportunity_assessment",
    "Você é o estrategista e pesquisador de um Social Media OS para advocacia brasileira. Avalie apenas os fatos fornecidos. Não invente conteúdo da notícia, decisão, lei, números ou resultado. A fonte e o título são evidência; se faltarem elementos, reduza confiança/pontuação. Risco alto significa maior necessidade de revisão humana. Retorne somente JSON válido.",
    `Título: ${input.title}\nResumo disponível: ${input.summary ?? "não informado"}\nFonte oficial: ${input.source}\nURL da fonte: ${input.sourceUrl}\nData: ${input.publishedAt ?? "não informada"}\nÁrea: ${input.area}\nScore técnico da fonte no radar: ${input.officialSourceScore}/100\nÁreas prioritárias: ${input.preferredAreas ?? "não definidas"}\nPúblico: ${input.targetAudience ?? "não definido"}\nAvalie potencial editorial e comercial de forma conservadora. O total deve ponderar relevância, atualidade, autoridade, utilidade comercial e risco.`,
    {
      type: "object",
      properties: {
        relevanceScore: scoreProperty,
        freshnessScore: scoreProperty,
        authorityScore: scoreProperty,
        commercialScore: scoreProperty,
        riskScore: scoreProperty,
        totalScore: scoreProperty,
        rationale: { type: "string" },
        recommendedFormat: { type: "string", enum: ["post", "carousel", "reel", "story"] },
      },
      required: ["relevanceScore", "freshnessScore", "authorityScore", "commercialScore", "riskScore", "totalScore", "rationale", "recommendedFormat"],
      additionalProperties: false,
    },
  );
}

export async function classifySocialInteraction(input: { network: string; body: string }) {
  return invokeJson<{
    kind: "question" | "praise" | "complaint" | "quote" | "support" | "opportunity" | "spam" | "legal_risk" | "sensitive";
    requiresHumanApproval: boolean;
    suggestedReply: string;
    rationale: string;
  }>(
    "social_interaction_triage",
    "Classifique interações recebidas por uma empresa brasileira. Nunca forneça aconselhamento jurídico individual como resposta automática. Reclamações graves, acusações, ameaças, imprensa, autoridades, dados pessoais, conflito, concessão financeira e risco jurídico devem exigir humano. Retorne apenas JSON válido.",
    `Rede: ${input.network}\nMensagem recebida: ${input.body}\nSugira resposta breve e profissional somente quando seguro; quando for sensível, a resposta deve apenas reconhecer o contato e indicar atendimento humano, sem admitir culpa ou prometer solução.`,
    {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["question", "praise", "complaint", "quote", "support", "opportunity", "spam", "legal_risk", "sensitive"] },
        requiresHumanApproval: { type: "boolean" },
        suggestedReply: { type: "string" },
        rationale: { type: "string" },
      },
      required: ["kind", "requiresHumanApproval", "suggestedReply", "rationale"],
      additionalProperties: false,
    },
  );
}

export async function generateVideoBrief(input: {
  title: string;
  platform: string;
  durationSeconds: number;
  audience: string;
  objective: string;
  source?: string | null;
  tone?: string | null;
}) {
  return invokeJson<{
    hook: string;
    script: string;
    shotList: Array<{ seconds: string; shot: string; direction: string }>;
    onScreenText: string[];
    thumbnailBrief: string;
    recordingGuidance: string;
  }>(
    "video_studio_brief",
    "Você é roteirista e diretor criativo de vídeos curtos profissionais. Não invente fatos, dados, leis, decisões ou provas. Quando houver conteúdo jurídico, mantenha linguagem educativa, sóbria e sem promessa de resultado. Retorne somente JSON válido.",
    `Tema: ${input.title}\nPlataforma: ${input.platform}\nDuração: ${input.durationSeconds}s\nPúblico: ${input.audience}\nObjetivo: ${input.objective}\nFonte fornecida: ${input.source ?? "nenhuma"}\nTom: ${input.tone ?? "profissional e humano"}. Crie roteiro filmável, orientação de câmera, textos curtos na tela e briefing de capa.`,
    {
      type: "object",
      properties: {
        hook: { type: "string" },
        script: { type: "string" },
        shotList: { type: "array", items: { type: "object", properties: { seconds: { type: "string" }, shot: { type: "string" }, direction: { type: "string" } }, required: ["seconds", "shot", "direction"], additionalProperties: false } },
        onScreenText: { type: "array", items: { type: "string" } },
        thumbnailBrief: { type: "string" },
        recordingGuidance: { type: "string" },
      },
      required: ["hook", "script", "shotList", "onScreenText", "thumbnailBrief", "recordingGuidance"],
      additionalProperties: false,
    },
    2200,
  );
}

export async function generateAdPlanningBrief(input: {
  platform: string;
  objective: string;
  audience: string;
  location?: string | null;
  offer?: string | null;
  budgetCents?: number | null;
  durationDays?: number | null;
  landingPageUrl?: string | null;
}) {
  return invokeJson<{
    audience: Record<string, unknown>;
    location: Record<string, unknown>;
    conversionEvent: string;
    successMetric: string;
    maxAcceptableCostGuidance: string;
    creativeVariations: Array<{ angle: string; headline: string; primaryText: string; cta: string }>;
    landingPageChecklist: string[];
    risks: string[];
  }>(
    "ads_intelligence_plan",
    "Você planeja mídia paga, mas não publica campanhas, não altera orçamento e não promete resultados. Não invente benchmarks, CPL, CPA ou ROAS sem dados fornecidos. Em publicidade jurídica, use linguagem informativa e sem mercantilização indevida. Retorne apenas JSON válido.",
    `Plataforma: ${input.platform}\nObjetivo: ${input.objective}\nPúblico: ${input.audience}\nLocalização: ${input.location ?? "não definida"}\nOferta/proposta: ${input.offer ?? "não definida"}\nOrçamento informado: ${input.budgetCents == null ? "não definido" : `R$ ${(input.budgetCents / 100).toFixed(2)}`}\nDuração: ${input.durationDays ?? "não definida"} dias\nLanding page: ${input.landingPageUrl ?? "não definida"}. Estruture um plano para aprovação humana. Quando não houver dado para custo máximo, descreva como calculá-lo em vez de inventar um valor.`,
    {
      type: "object",
      properties: {
        audience: { type: "object", additionalProperties: true },
        location: { type: "object", additionalProperties: true },
        conversionEvent: { type: "string" },
        successMetric: { type: "string" },
        maxAcceptableCostGuidance: { type: "string" },
        creativeVariations: { type: "array", items: { type: "object", properties: { angle: { type: "string" }, headline: { type: "string" }, primaryText: { type: "string" }, cta: { type: "string" } }, required: ["angle", "headline", "primaryText", "cta"], additionalProperties: false } },
        landingPageChecklist: { type: "array", items: { type: "string" } },
        risks: { type: "array", items: { type: "string" } },
      },
      required: ["audience", "location", "conversionEvent", "successMetric", "maxAcceptableCostGuidance", "creativeVariations", "landingPageChecklist", "risks"],
      additionalProperties: false,
    },
    2500,
  );
}

export async function generatePerformanceNarrative(input: {
  periodLabel: string;
  metrics: Record<string, number>;
  topContent: Array<{ title: string; network: string; reach: number; impressions: number; likes: number; comments: number; shares: number; saves: number; clicks: number; leads: number }>;
}) {
  return invokeJson<{
    summary: string;
    findings: string[];
    recommendations: string[];
    insights: Array<{ type: "topic" | "format" | "schedule" | "cta" | "audience" | "channel"; title: string; evidence: string; recommendation: string; confidenceScore: number }>;
  }>(
    "performance_report",
    "Você é analista de marketing. Trabalhe somente com os números fornecidos. Diferencie evidência de hipótese. Não atribua causalidade quando houver apenas correlação e não invente benchmark externo. Retorne apenas JSON válido.",
    `Período: ${input.periodLabel}\nMétricas agregadas: ${JSON.stringify(input.metrics)}\nConteúdos com evidência: ${JSON.stringify(input.topContent)}\nExplique o que os dados sustentam, limitações e próximos testes controlados.`,
    {
      type: "object",
      properties: {
        summary: { type: "string" },
        findings: { type: "array", items: { type: "string" } },
        recommendations: { type: "array", items: { type: "string" } },
        insights: { type: "array", items: { type: "object", properties: { type: { type: "string", enum: ["topic", "format", "schedule", "cta", "audience", "channel"] }, title: { type: "string" }, evidence: { type: "string" }, recommendation: { type: "string" }, confidenceScore: scoreProperty }, required: ["type", "title", "evidence", "recommendation", "confidenceScore"], additionalProperties: false } },
      },
      required: ["summary", "findings", "recommendations", "insights"],
      additionalProperties: false,
    },
    2500,
  );
}
