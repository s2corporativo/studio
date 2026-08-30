export type ContentIntent = "authority" | "education" | "commercial" | "relationship" | "news";

export type ContentFingerprint = {
  themeTokens: string[];
  area: string;
  audience: string;
  intent: ContentIntent;
  format: string;
  visualFamily: string | null;
  visualObjects: string[];
  ctaClass: "none" | "informational" | "conversation" | "contact" | "conversion";
  tone: string;
};

const STOP_WORDS = new Set([
  "para", "como", "mais", "sobre", "entre", "pela", "pelo", "pela", "dos", "das", "uma", "que", "com", "sem",
  "direito", "direitos", "advocacia", "juridico", "juridica", "jurídico", "jurídica", "conteudo", "conteúdo",
]);

function normalize(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function significantTokens(value: string | null | undefined, limit = 12) {
  const counts = new Map<string, number>();
  for (const token of normalize(value).split(" ")) {
    if (token.length < 4 || STOP_WORDS.has(token)) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))
    .slice(0, limit)
    .map(([token]) => token);
}

function inferIntent(input: { objective?: string | null; pillar?: string | null; funnelStage?: string | null; campaign?: string | null }) : ContentIntent {
  const text = normalize(`${input.objective ?? ""} ${input.pillar ?? ""} ${input.funnelStage ?? ""} ${input.campaign ?? ""}`);
  if (/radar|noticia|noticias|atualidade|decisao|jurisprudencia/.test(text)) return "news";
  if (/conversion|conversao|orcamento|contrat|lead|comercial/.test(text)) return "commercial";
  if (/relationship|relacionamento|bastidor|institucional|comunidade/.test(text)) return "relationship";
  if (/autoridade|authority|tecnico|tecnica|especial/.test(text)) return "authority";
  return "education";
}

function inferCtaClass(cta: string | null | undefined): ContentFingerprint["ctaClass"] {
  const text = normalize(cta);
  if (!text) return "none";
  if (/contrat|agend|consulta|orcamento|proposta/.test(text)) return "conversion";
  if (/whatsapp|contato|fale|mensagem|direct|dm/.test(text)) return "contact";
  if (/comente|conte|duvida|conversa|compartilhe/.test(text)) return "conversation";
  return "informational";
}

function compact(value: string | null | undefined, fallback: string) {
  return normalize(value) || fallback;
}

export function buildContentFingerprint(input: {
  title: string;
  hook?: string | null;
  caption?: string | null;
  area: string;
  audience?: string | null;
  objective?: string | null;
  pillar?: string | null;
  campaign?: string | null;
  funnelStage?: string | null;
  format: string;
  visualFamily?: string | null;
  visualObjects?: string[] | null;
  cta?: string | null;
  tone?: string | null;
}): ContentFingerprint {
  return {
    themeTokens: significantTokens(`${input.title} ${input.hook ?? ""} ${input.caption ?? ""}`),
    area: compact(input.area, "nao-definida"),
    audience: compact(input.audience, "geral"),
    intent: inferIntent(input),
    format: compact(input.format, "post"),
    visualFamily: input.visualFamily ? compact(input.visualFamily, "") || null : null,
    visualObjects: [...new Set((input.visualObjects ?? []).map(item => compact(item, "")).filter(Boolean))].sort(),
    ctaClass: inferCtaClass(input.cta),
    tone: compact(input.tone, "profissional"),
  };
}

function jaccard(left: string[], right: string[]) {
  const a = new Set(left);
  const b = new Set(right);
  if (a.size === 0 && b.size === 0) return 1;
  const intersection = [...a].filter(item => b.has(item)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

export function fingerprintSimilarity(candidate: ContentFingerprint, existing: ContentFingerprint) {
  const dimensions = {
    theme: jaccard(candidate.themeTokens, existing.themeTokens) * 28,
    visualFamily: candidate.visualFamily && existing.visualFamily && candidate.visualFamily === existing.visualFamily ? 18 : 0,
    visualObjects: jaccard(candidate.visualObjects, existing.visualObjects) * 14,
    area: candidate.area === existing.area ? 10 : 0,
    audience: candidate.audience === existing.audience ? 8 : 0,
    intent: candidate.intent === existing.intent ? 9 : 0,
    format: candidate.format === existing.format ? 7 : 0,
    cta: candidate.ctaClass === existing.ctaClass ? 4 : 0,
    tone: candidate.tone === existing.tone ? 2 : 0,
  };
  const score = Math.round(Object.values(dimensions).reduce((sum, value) => sum + value, 0));
  const reasons = Object.entries(dimensions)
    .filter(([, value]) => value >= 5)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);
  return { score: Math.max(0, Math.min(100, score)), reasons, dimensions };
}

export function highestSimilarity(candidate: ContentFingerprint, history: ContentFingerprint[]) {
  return history.reduce(
    (best, item, index) => {
      const comparison = fingerprintSimilarity(candidate, item);
      return comparison.score > best.score ? { ...comparison, index } : best;
    },
    { score: 0, reasons: [] as string[], dimensions: {} as Record<string, number>, index: -1 },
  );
}
