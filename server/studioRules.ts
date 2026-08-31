import { evaluateOabCompliance } from "../shared/compliance";
import type { ContentStatus } from "../drizzle/schema";

type ApprovalInput = {
  sourceId?: number | null;
  legalSource?: string | null;
  reviewDueAt?: Date | null;
  approvalOwnerName?: string | null;
  title?: string | null;
  hook?: string | null;
  caption?: string | null;
  cta?: string | null;
  prohibitedTerms?: string | null;
};

export function approvalReadiness(input: ApprovalInput) {
  const missing: string[] = [];
  if (!input.sourceId) missing.push("fonte vinculada");
  if (!input.reviewDueAt) missing.push("data de revisão");
  if (!input.approvalOwnerName?.trim()) missing.push("responsável pela aprovação");
  const compliance = evaluateOabCompliance(input);
  const blocking = compliance.filter(issue => issue.severity === "block");
  if (blocking.length) missing.push(`compliance: ${blocking.map(issue => issue.label).join("; ")}`);
  return { ready: missing.length === 0, missing, compliance };
}

export function canSchedule(status: ContentStatus, scheduledAt?: Date | null) {
  if (status !== "approved") {
    return { allowed: false, reason: "Apenas conteúdos aprovados podem ser agendados." };
  }
  if (!scheduledAt || scheduledAt.getTime() <= Date.now()) {
    return { allowed: false, reason: "Informe uma data futura para o agendamento." };
  }
  return { allowed: true as const };
}

export function canSubmitForReview(input: ApprovalInput) {
  if (!input.sourceId) {
    return { allowed: false, reason: "Vincule uma fonte da central antes de enviar para revisão." };
  }
  if (!input.reviewDueAt) {
    return { allowed: false, reason: "Defina a data de revisão antes de enviar o conteúdo." };
  }
  const blocking = evaluateOabCompliance(input).filter(issue => issue.severity === "block");
  if (blocking.length) {
    return { allowed: false, reason: `Compliance bloqueou o envio: ${blocking.map(issue => issue.label).join("; ")}.` };
  }
  return { allowed: true as const };
}
