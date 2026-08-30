export const artworkStyles = {
  tech_premium:
    "premium institutional campaign photography, sophisticated contemporary legal visual language, deep charcoal green, restrained bronze highlights and ivory details, elegant architectural geometry",
  editorial:
    "premium editorial magazine photography for a refined Brazilian law institution, deep green and bronze materials, dramatic but sober light, sophisticated composition",
  photographic:
    "high-end realistic corporate photography, natural people and environments, cinematic light, authentic Brazilian professional context",
  minimal:
    "minimal premium composition, restrained geometric forms, deep green negative space and discrete bronze detail, sophisticated legal atmosphere",
} as const;

export type ArtworkStyle = keyof typeof artworkStyles;

export type ArtworkBrandContext = {
  brandName?: string | null;
  segment?: string | null;
  targetAudience?: string | null;
  visualGuidelines?: string | null;
} | null;

const MAX_BRAND_GUIDELINE_CHARS = 500;

const sanitizeFreeText = (value: string | null | undefined, maxLength: number): string | null => {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength).trimEnd()}…` : normalized;
};

export function buildArtworkPrompt(input: {
  title: string;
  area: string;
  style: ArtworkStyle;
  direction?: string | null;
  brand?: ArtworkBrandContext;
}): string {
  const brandName = sanitizeFreeText(input.brand?.brandName, 180) ?? "De Paula Teixeira Advocacia";
  const segment = sanitizeFreeText(input.brand?.segment, 180);
  const audience = sanitizeFreeText(input.brand?.targetAudience, 300);
  const guidelines = sanitizeFreeText(input.brand?.visualGuidelines, MAX_BRAND_GUIDELINE_CHARS);
  const extraDirection = sanitizeFreeText(input.direction, 1000);

  const parts: string[] = [
    "Create a vertical 4:5 Instagram background image for a Brazilian law firm social-media post.",
    `Topic: ${input.title}.`,
    `Legal area: ${input.area}.`,
    `Brand: ${brandName}.`,
  ];
  if (segment) parts.push(`Brand segment: ${segment}.`);
  if (audience) parts.push(`Audience the image must feel welcoming to: ${audience}.`);
  parts.push(`Visual direction: ${artworkStyles[input.style]}.`);
  if (guidelines) parts.push(`Brand visual guidelines to honor: ${guidelines}.`);
  if (extraDirection) parts.push(`Additional creative direction: ${extraDirection}.`);
  parts.push(
    "COMPOSITION: clean and uncluttered with a single clear focal point; generous intentional negative space reserved for professionally rendered typography; balanced harmonious institutional palette of deep charcoal green, restrained bronze and ivory; soft flattering light; premium, pleasant and inviting atmosphere.",
    "IMPORTANT: image only, NO words, NO letters, NO numbers, NO logos, NO watermarks, NO scales of justice, NO gavels, NO generic AI-looking humanoid imagery.",
    "AVOID: visual clutter, busy patterns, collage of many competing elements, oversaturated or neon colors, harsh shadows, distorted anatomy or malformed hands, plastic artificial-looking skin, stocky clichés.",
    "High-end advertising art direction, realistic materials, excellent lighting, visually striking yet sober and credible."
  );
  return parts.join(" ");
}
