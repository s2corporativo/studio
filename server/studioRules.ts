import type { ContentStatus } from "../drizzle/schema";

type ApprovalInput = {
  sourceId?: number | null;
  legalSource?: string | null;
  reviewDueAt?: Date | null;
  approvalOwnerName?: string | null;
};

export function approvalReadiness(input: ApprovalInput) {
  const missing: string[] = [];
  if (!input.sourceId) missing.push("fonte vinculada");
  if (!input.reviewDueAt) missing.push("data de revisão");
  if (!input.approvalOwnerName?.trim()) missing.push("responsável pela aprovação");
  return { ready: missing.length === 0, missing };
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
  return { allowed: true as const };
}
