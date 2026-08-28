import { evaluateOabCompliance } from "./compliance";
export type PrePublicationInput = {
  title?: string | null;
  hook?: string | null;
  caption?: string | null;
  cta?: string | null;
  sourceId?: number | string | null;
  legalSource?: string | null;
  keyStatement?: string | null;
  reviewDueAt?: string | Date | null;
  mediaUrl?: string | null;
  prohibitedTerms?: string | null;
};

export type PrePublicationScore = {
  score: number;
  passed: string[];
  pending: string[];
};

function hasText(value?: string | null) {
  return Boolean(value?.trim());
}

export function calculatePrePublicationScore(input: PrePublicationInput): PrePublicationScore {
  const passed: string[] = [];
  const pending: string[] = [];
  const captionLength = input.caption?.trim().length ?? 0;
  const complianceIssues = evaluateOabCompliance(input);
  const criteria = [
    { label: "clareza", valid: hasText(input.title) && hasText(input.hook) && captionLength >= 80 },
    { label: "CTA", valid: hasText(input.cta) },
    { label: "compliance OAB", valid: !complianceIssues.some(issue => issue.severity === "block") },
    { label: "legibilidade", valid: captionLength >= 80 && captionLength <= 2200 },
    { label: "risco regulatório", valid: Boolean(input.sourceId) && hasText(input.legalSource) && hasText(input.keyStatement) && Boolean(input.reviewDueAt) && hasText(input.mediaUrl) },
  ];
  criteria.forEach((criterion) => (criterion.valid ? passed : pending).push(criterion.label));
  return { score: passed.length * 20, passed, pending };
}
