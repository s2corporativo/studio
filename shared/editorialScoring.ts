import { significantTokens } from "./contentFingerprint";

export type EditorialPotential = {
  authorityScore: number;
  engagementScore: number;
  commercialIntentScore: number;
  reasons: string[];
  methodology: "heuristic_not_outcome_prediction";
};

const COMMERCIAL_SIGNALS = ["fraude", "infracao", "autuacao", "fiscalizacao", "acidente", "demissao", "rescisao", "contrato", "divida", "cobranca", "bloqueio", "intimacao", "processo", "vazamento", "licenciamento", "passivo"];
const AUTHORITY_SIGNALS = ["stf", "stj", "tst", "trt", "lei", "reforma", "jurisprudencia", "regulacao", "norma", "fiscalizacao", "lgpd", "tributaria", "ambiental", "compliance"];
const ENGAGEMENT_SIGNALS = ["como", "quando", "erro", "evite", "checklist", "passo", "documento", "prazo", "fraude", "golpe", "direito", "duvida", "mito"];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

function scoreSignals(text: string, signals: string[], perSignal: number, cap: number) {
  const normalized = normalize(text);
  const hits = signals.filter(signal => normalized.includes(signal));
  return { points: Math.min(cap, hits.length * perSignal), hits };
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function scoreEditorialPotential(input: {
  title: string;
  hook?: string | null;
  area?: string | null;
  audience?: string | null;
  format?: string | null;
  sourceUrl?: string | null;
  sourceName?: string | null;
  publishedAt?: string | null;
  now?: Date;
}): EditorialPotential {
  const text = `${input.title} ${input.hook ?? ""} ${input.area ?? ""}`;
  const commercial = scoreSignals(text, COMMERCIAL_SIGNALS, 9, 45);
  const authority = scoreSignals(text, AUTHORITY_SIGNALS, 8, 40);
  const engagement = scoreSignals(text, ENGAGEMENT_SIGNALS, 7, 35);
  const tokens = significantTokens(text);
  const hasOfficialishSource = Boolean(input.sourceUrl && /\.(jus|gov)\.br|stf\.jus\.br|stj\.jus\.br|tst\.jus\.br|trt\d*\.jus\.br/i.test(input.sourceUrl));
  const businessAudience = /empresa|gestor|rh|empresari|negocio/i.test(normalize(input.audience ?? ""));
  const practicalFormat = /carousel|carrossel|reel|story/i.test(input.format ?? "");

  let freshnessBonus = 0;
  if (input.publishedAt) {
    const parsed = Date.parse(input.publishedAt);
    if (!Number.isNaN(parsed)) {
      const ageDays = Math.max(0, ((input.now ?? new Date()).getTime() - parsed) / 86_400_000);
      freshnessBonus = ageDays <= 2 ? 12 : ageDays <= 7 ? 8 : ageDays <= 30 ? 3 : 0;
    }
  }

  const reasons: string[] = [];
  if (commercial.hits.length) reasons.push(`sinais comerciais: ${commercial.hits.join(", ")}`);
  if (authority.hits.length) reasons.push(`sinais de autoridade: ${authority.hits.join(", ")}`);
  if (engagement.hits.length) reasons.push(`sinais de utilidade/engajamento: ${engagement.hits.join(", ")}`);
  if (hasOfficialishSource) reasons.push("fonte oficial reconhecível");
  if (businessAudience) reasons.push("público empresarial explícito");
  if (freshnessBonus) reasons.push("conteúdo temporalmente recente");

  return {
    authorityScore: clamp(32 + authority.points + (hasOfficialishSource ? 18 : 0) + freshnessBonus + Math.min(8, tokens.length)),
    engagementScore: clamp(30 + engagement.points + (practicalFormat ? 12 : 0) + Math.min(12, tokens.length)),
    commercialIntentScore: clamp(22 + commercial.points + (businessAudience ? 18 : 0) + (practicalFormat ? 5 : 0)),
    reasons,
    methodology: "heuristic_not_outcome_prediction",
  };
}
