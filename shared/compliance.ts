export type ComplianceIssue = {
  id: string;
  severity: "warning" | "block";
  label: string;
  evidence: string;
};

type ComplianceInput = {
  title?: string | null;
  hook?: string | null;
  caption?: string | null;
  cta?: string | null;
  prohibitedTerms?: string | null;
};

const BLOCK_RULES: Array<{ id: string; label: string; pattern: RegExp }> = [
  { id: "promise", label: "Possível promessa de resultado", pattern: /\b(causa\s+ganha|resultado\s+(?:garantido|certo)|garantimos|vit[oó]ria\s+garantida|ganhe\s+sua\s+causa)\b/i },
  { id: "direct_solicitation", label: "Possível captação direta", pattern: /\b(contrate\s+(?:agora|nosso|nossa)|procure\s+seus\s+direitos\s+aqui|fale\s+agora\s+com\s+(?:um|nosso)|clique\s+para\s+contratar)\b/i },
  { id: "price", label: "Oferta comercial ou preço em publicidade jurídica", pattern: /\b(gr[aá]tis|gratuito|desconto|promo[cç][aã]o|honor[aá]rios\s+a\s+partir|por\s+apenas\s+r\$|parcelamos\s+honor[aá]rios)\b/i },
  { id: "comparison", label: "Comparação ou autoengrandecimento", pattern: /\b(o\s+melhor\s+advogado|melhor\s+escrit[oó]rio|n[uú]mero\s+1|mais\s+eficiente|mais\s+experiente\s+da\s+regi[aã]o)\b/i },
  { id: "artificial_urgency", label: "Urgência artificial para contratação", pattern: /\b([uú]ltima\s+chance|n[aã]o\s+perca\s+tempo|corra\s+antes|contrate\s+hoje|somente\s+hoje)\b/i },
];

const WARNING_RULES: Array<{ id: string; label: string; pattern: RegExp }> = [
  { id: "case_result", label: "Referência a resultado/caso concreto exige revisão", pattern: /\b(conseguimos|obtivemos|ganhamos|indeniza[cç][aã]o\s+de\s+r\$|cliente\s+recebeu|caso\s+real)\b/i },
  { id: "specialist", label: "Uso de especialidade deve ser conferido", pattern: /\b(especialista|especializado|especializada)\b/i },
  { id: "sensational", label: "Linguagem potencialmente sensacionalista", pattern: /\b(chocante|absurdo|esc[aâ]ndalo|bomba|imperd[ií]vel|segredo\s+jur[ií]dico)\b/i },
];

export function evaluateOabCompliance(input: ComplianceInput): ComplianceIssue[] {
  const text = [input.title, input.hook, input.caption, input.cta].filter(Boolean).join(" \n ");
  const issues: ComplianceIssue[] = [];
  for (const rule of BLOCK_RULES) {
    const match = text.match(rule.pattern);
    if (match) issues.push({ id: rule.id, severity: "block", label: rule.label, evidence: match[0] });
  }
  for (const rule of WARNING_RULES) {
    const match = text.match(rule.pattern);
    if (match) issues.push({ id: rule.id, severity: "warning", label: rule.label, evidence: match[0] });
  }
  const customTerms = (input.prohibitedTerms ?? "").split(",").map(term => term.trim()).filter(Boolean);
  const lower = text.toLocaleLowerCase("pt-BR");
  for (const term of customTerms) {
    if (lower.includes(term.toLocaleLowerCase("pt-BR"))) {
      issues.push({ id: `brand-term:${term}`, severity: "block", label: "Termo proibido pela política da marca", evidence: term });
    }
  }
  return Array.from(new Map(issues.map(issue => [`${issue.id}:${issue.evidence.toLowerCase()}`, issue])).values());
}
