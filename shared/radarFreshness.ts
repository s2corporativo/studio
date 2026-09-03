export type RadarFreshnessStatus = "fresh" | "aging" | "expired" | "needs_date_verification";

export type RadarValidity = {
  consultedAt: string;
  validUntil: string;
  freshnessStatus: RadarFreshnessStatus;
  ageDays: number | null;
  ttlDays: number;
};

export function radarEditorialTtlDays(input: { source: string; area?: string | null }) {
  const text = `${input.source} ${input.area ?? ""}`.toLocaleLowerCase("pt-BR");
  if (/jurisprud|informativo|tese/.test(text)) return 30;
  if (/stf|stj|tst|trt|noticia|notícias/.test(text)) return 7;
  return 7;
}

export function calculateRadarValidity(input: {
  source: string;
  area?: string | null;
  publishedAt?: string | null;
  consultedAt?: Date;
}): RadarValidity {
  const consultedAt = input.consultedAt ?? new Date();
  const ttlDays = radarEditorialTtlDays(input);
  if (!input.publishedAt || Number.isNaN(Date.parse(input.publishedAt))) {
    return {
      consultedAt: consultedAt.toISOString(),
      validUntil: new Date(consultedAt.getTime() + 2 * 86_400_000).toISOString(),
      freshnessStatus: "needs_date_verification",
      ageDays: null,
      ttlDays: 2,
    };
  }
  const publishedAt = new Date(input.publishedAt);
  const ageDays = Math.max(0, (consultedAt.getTime() - publishedAt.getTime()) / 86_400_000);
  const validUntil = new Date(publishedAt.getTime() + ttlDays * 86_400_000);
  const freshnessStatus: RadarFreshnessStatus = consultedAt > validUntil
    ? "expired"
    : ageDays >= ttlDays * 0.7
      ? "aging"
      : "fresh";
  return {
    consultedAt: consultedAt.toISOString(),
    validUntil: validUntil.toISOString(),
    freshnessStatus,
    ageDays: Math.round(ageDays * 10) / 10,
    ttlDays,
  };
}

export function canUseRadarItemWithoutDateReview(validity: RadarValidity) {
  return validity.freshnessStatus === "fresh" || validity.freshnessStatus === "aging";
}
