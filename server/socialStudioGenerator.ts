import { listLLMModels, invokeLLM } from "./_core/llm";

export type DraftGenerationInput = {
  area: string;
  topic: string;
  audience: string;
  format: "post" | "carousel" | "reel" | "story";
  objective: string;
  legalSource?: string | null;
  primaryCta?: string | null;
  toneOfVoice?: string | null;
  prohibitedTerms?: string | null;
};

export async function generateLegalDraft(input: DraftGenerationInput) {
  const catalog = await listLLMModels();
  const model = catalog.data.find(item => item.id === "gpt-5-mini")?.id ?? catalog.data[0]?.id;
  const response = await invokeLLM({
    model,
    maxCompletionTokens: 1800,
    reasoning: { effort: "minimal" },
    messages: [
      {
        role: "system",
        content: "Você redige conteúdo jurídico brasileiro para Instagram. Seja preciso, claro e sóbrio. Não crie leis, decisões, prazos, números ou fontes. Não prometa resultado, não use sensacionalismo e não substitua análise jurídica individual. Devolva somente JSON válido.",
      },
      {
        role: "user",
        content: `Crie um rascunho para Instagram. Área: ${input.area}. Tema: ${input.topic}. Público: ${input.audience}. Formato: ${input.format}. Objetivo: ${input.objective}. Tom: ${input.toneOfVoice ?? "técnico e humano"}. CTA institucional: ${input.primaryCta ?? "Conheça nossos canais oficiais de contato."}. Termos proibidos: ${input.prohibitedTerms ?? "promessas de resultado"}. Fonte jurídica recebida: ${input.legalSource ?? "nenhuma; indique que a fonte precisa ser incluída antes da revisão"}. Para carrossel, a legenda deve convidar a deslizar, mas não crie texto de cada lâmina.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "social_studio_draft",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            hook: { type: "string" },
            caption: { type: "string" },
            cta: { type: "string" },
            hashtags: { type: "string" },
            altText: { type: "string" },
          },
          required: ["title", "hook", "caption", "cta", "hashtags", "altText"],
          additionalProperties: false,
        },
      },
    },
  });
  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("Não foi possível gerar o rascunho agora.");
  return JSON.parse(content) as {
    title: string;
    hook: string;
    caption: string;
    cta: string;
    hashtags: string;
    altText: string;
  };
}
