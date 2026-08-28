import { describe, expect, it } from "vitest";
import { approvalReadiness, canSchedule, canSubmitForReview } from "./studioRules";

describe("regras do Social Studio", () => {
  it("bloqueia o envio para revisão sem fonte vinculada ou data de revisão", () => {
    expect(canSubmitForReview({ sourceId: null, reviewDueAt: null })).toEqual({
      allowed: false,
      reason: "Vincule uma fonte da central antes de enviar para revisão.",
    });
    expect(canSubmitForReview({ sourceId: 1, reviewDueAt: null })).toEqual({
      allowed: false,
      reason: "Defina a data de revisão antes de enviar o conteúdo.",
    });
  });

  it("exige fonte, data e responsável para aprovação", () => {
    expect(approvalReadiness({ sourceId: 1, reviewDueAt: new Date() })).toMatchObject({
      ready: false,
      missing: ["responsável pela aprovação"],
    });
    expect(approvalReadiness({ sourceId: 1, reviewDueAt: new Date(), approvalOwnerName: "Dr. Clovis" })).toMatchObject({
      ready: true,
      missing: [],
    });
  });

  it("permite agendamento apenas para conteúdos aprovados com data futura", () => {
    expect(canSchedule("review", new Date(Date.now() + 60_000))).toEqual({
      allowed: false,
      reason: "Apenas conteúdos aprovados podem ser agendados.",
    });
    expect(canSchedule("approved", new Date(Date.now() - 60_000))).toEqual({
      allowed: false,
      reason: "Informe uma data futura para o agendamento.",
    });
    expect(canSchedule("approved", new Date(Date.now() + 60_000))).toEqual({ allowed: true });
  });
});
