import { describe, expect, it } from "vitest";
import { assertInstagramScheduleReadiness, oneTimeInstagramCron } from "./instagramSchedule";

describe("agendamento de publicação do Instagram", () => {
  it("gera expressão UTC de seis campos para a data futura", () => {
    const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(oneTimeInstagramCron(date).split(" ")).toHaveLength(6);
  });

  it("rejeita uma data que já passou", () => {
    expect(() => oneTimeInstagramCron(new Date(Date.now() - 1_000))).toThrow("data futura");
  });

  it("bloqueia agendamento sem teste não público aprovado", () => {
    expect(() => assertInstagramScheduleReadiness({ status: "queued", confirmedAt: new Date(), testedAt: null, testContainerId: null })).toThrow("teste não público");
  });
});
