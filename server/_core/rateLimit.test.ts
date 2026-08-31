import { afterEach, describe, expect, it } from "vitest";
import { consumeRateLimit, resetRateLimits, type RateLimitRule } from "./rateLimit";

const rule: RateLimitRule = { limit: 3, windowMs: 60_000 };

describe("rate limit de operações de IA", () => {
  afterEach(() => resetRateLimits());

  it("permite chamadas dentro do limite da janela", () => {
    expect(() => {
      consumeRateLimit(1, "op", rule, 1_000);
      consumeRateLimit(1, "op", rule, 2_000);
      consumeRateLimit(1, "op", rule, 3_000);
    }).not.toThrow();
  });

  it("bloqueia a chamada que excede o limite com mensagem clara", () => {
    consumeRateLimit(1, "op", rule, 1_000);
    consumeRateLimit(1, "op", rule, 2_000);
    consumeRateLimit(1, "op", rule, 3_000);
    expect(() => consumeRateLimit(1, "op", rule, 4_000)).toThrow(/Limite de geração atingido/);
  });

  it("libera novamente quando a janela desliza", () => {
    consumeRateLimit(1, "op", rule, 1_000);
    consumeRateLimit(1, "op", rule, 2_000);
    consumeRateLimit(1, "op", rule, 3_000);
    expect(() => consumeRateLimit(1, "op", rule, 62_000)).not.toThrow();
  });

  it("isola contadores por usuário e por operação", () => {
    consumeRateLimit(1, "op", rule, 1_000);
    consumeRateLimit(1, "op", rule, 1_100);
    consumeRateLimit(1, "op", rule, 1_200);
    expect(() => consumeRateLimit(2, "op", rule, 1_300)).not.toThrow();
    expect(() => consumeRateLimit(1, "outra-op", rule, 1_400)).not.toThrow();
    expect(() => consumeRateLimit(1, "op", rule, 1_500)).toThrow(/Limite de geração atingido/);
  });
});
