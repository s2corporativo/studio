import { invokeLLM, listLLMModels } from "./_core/llm";
import { pickPreferredLlmModel } from "./_core/modelPreference";
import { compositionDirectiveFor, overusedLegalMotifs } from "../shared/visualRepetition";
import { buildContentFingerprint, highestSimilarity, type ContentFingerprint } from "../shared/contentFingerprint";

export type CreativeDirection = {
  visualFamily: string;
  medium: "photography" | "editorial_still_life" | "information_design" | "environmental_scene";
  focalSubject: string;
  environment: string;
  camera: string;
  lighting: string;
  composition: string;
  negativeSpace: string;
  visualObjects: string[];
  avoid: string[];
  rationale: string;
  repetitionScoreBeforeGeneration: number;
};

async function modelId() {
  const catalog = await listLLMModels();
  const model = pickPreferredLlmModel(catalog);
  if (!model) throw new Error("Nenhum modelo de IA está disponível para o Creative Director.");
  return model;
}

export function buildCreativeDirectorPrompt(input: {
  title: string;
  area: string;
  audience?: string | null;
  objective?: string | null;
  format?: string | null;
  userDirection?: string | null;
  recentFingerprints?: ContentFingerprint[];
}) {
  const deterministicFamily = compositionDirectiveFor(`${input.area}:${input.title}`);
  const candidate = buildContentFingerprint({
    title: input.title,
    area: input.area,
    audience: input.audience,
    objective: input.objective,
    format: input.format ?? "post",
    visualFamily: deterministicFamily.key,
  });
  const similarity = highestSimilarity(candidate, input.recentFingerprints ?? []);
  return {
    deterministicFamily,
    similarity,
    system: "Você é o Creative Director de um Social Media OS profissional. Sua função é criar um briefing visual filmável/renderizável antes da geração de imagem. Não invente clientes, resultados, depoimentos, fatos jurídicos, selos ou qualificações. Preserve sobriedade institucional e aparência humana. Evite clichês jurídicos repetidos e escolha uma composição claramente diferente quando o histórico estiver parecido. Retorne somente JSON válido.",
    user: [
      `Tema: ${input.title}`,
      `Área: ${input.area}`,
      `Público: ${input.audience ?? "não informado"}`,
      `Objetivo: ${input.objective ?? "não informado"}`,
      `Formato: ${input.format ?? "post"}`,
      `Família visual pré-selecionada: ${deterministicFamily.key} — ${deterministicFamily.prompt}`,
      `Maior similaridade estrutural com histórico recente: ${similarity.score}/100. Dimensões coincidentes: ${similarity.reasons.join(", ") || "nenhuma relevante"}.`,
      `Direção humana adicional: ${input.userDirection ?? "nenhuma"}`,
      `Motivos sobreutilizados que não devem ser padrão: ${overusedLegalMotifs.join(", ")}.`,
      "Defina um único foco visual, ambiente, distância de câmera, luz, composição, espaço negativo e poucos objetos semanticamente úteis. Se a similaridade for >=70, force mudança visível de ambiente, distância de câmera ou meio visual.",
    ].join("\n"),
  };
}

export async function generateCreativeDirection(input: Parameters<typeof buildCreativeDirectorPrompt>[0]): Promise<CreativeDirection> {
  const prompt = buildCreativeDirectorPrompt(input);
  const response = await invokeLLM({
    model: await modelId(),
    maxCompletionTokens: 1300,
    reasoning: { effort: "minimal" },
    messages: [{ role: "system", content: prompt.system }, { role: "user", content: prompt.user }],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "creative_direction",
        strict: true,
        schema: {
          type: "object",
          properties: {
            medium: { type: "string", enum: ["photography", "editorial_still_life", "information_design", "environmental_scene"] },
            focalSubject: { type: "string" },
            environment: { type: "string" },
            camera: { type: "string" },
            lighting: { type: "string" },
            composition: { type: "string" },
            negativeSpace: { type: "string" },
            visualObjects: { type: "array", items: { type: "string" }, maxItems: 6 },
            avoid: { type: "array", items: { type: "string" }, maxItems: 10 },
            rationale: { type: "string" },
          },
          required: ["medium", "focalSubject", "environment", "camera", "lighting", "composition", "negativeSpace", "visualObjects", "avoid", "rationale"],
          additionalProperties: false,
        },
      },
    },
  });
  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("O Creative Director não retornou briefing estruturado.");
  const parsed = JSON.parse(content) as Omit<CreativeDirection, "visualFamily" | "repetitionScoreBeforeGeneration">;
  return {
    ...parsed,
    visualFamily: prompt.deterministicFamily.key,
    repetitionScoreBeforeGeneration: prompt.similarity.score,
  };
}

export function creativeDirectionToPrompt(direction: CreativeDirection) {
  return [
    `Creative Director family: ${direction.visualFamily}.`,
    `Medium: ${direction.medium}. Focal subject: ${direction.focalSubject}.`,
    `Environment: ${direction.environment}. Camera: ${direction.camera}. Lighting: ${direction.lighting}.`,
    `Composition: ${direction.composition}. Negative space: ${direction.negativeSpace}.`,
    `Useful objects only: ${direction.visualObjects.join(", ") || "none"}.`,
    `Avoid: ${direction.avoid.join(", ") || "generic legal clichés"}.`,
  ].join(" ");
}
