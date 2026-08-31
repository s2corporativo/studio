export const humanizationTargets = {
  graphic_design: 40,
  video: 30,
  human_photo: 20,
  behind_scenes: 10,
} as const;

export type HumanizationCategory = keyof typeof humanizationTargets;

export function assessHumanizationMix(items: Array<{ category: HumanizationCategory }>) {
  const total = items.length;
  const counts: Record<HumanizationCategory, number> = { graphic_design: 0, video: 0, human_photo: 0, behind_scenes: 0 };
  for (const item of items) counts[item.category] += 1;
  const actual = Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, total ? Math.round((value / total) * 100) : 0])) as Record<HumanizationCategory, number>;
  const gaps = (Object.keys(humanizationTargets) as HumanizationCategory[]).map(category => ({
    category,
    target: humanizationTargets[category],
    actual: actual[category],
    gap: humanizationTargets[category] - actual[category],
  })).sort((a, b) => b.gap - a.gap);
  return {
    total,
    counts,
    actual,
    gaps,
    nextRecommendedCategory: gaps[0]?.gap > 0 ? gaps[0].category : null,
    humanPresencePercent: actual.human_photo + actual.behind_scenes + actual.video,
  };
}

export function inferHumanizationCategory(input: { format?: string | null; contentPillar?: string | null; templateKey?: string | null; title?: string | null }): HumanizationCategory {
  const text = `${input.contentPillar ?? ""} ${input.templateKey ?? ""} ${input.title ?? ""}`.toLocaleLowerCase("pt-BR");
  if (/bastidor|rotina|escritorio|equipe|evento/.test(text)) return "behind_scenes";
  if (/foto|retrato|advogado|equipe/.test(text)) return "human_photo";
  if (/reel|video/.test((input.format ?? "").toLocaleLowerCase("pt-BR"))) return "video";
  return "graphic_design";
}
