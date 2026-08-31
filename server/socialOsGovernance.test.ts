import { describe, expect, it } from "vitest";
import { assertPostMediaMutable } from "./socialOsGovernance";

describe("governança de mídia sem triggers TiDB", () => {
  it("permite mídia em rascunho e revisão", () => {
    expect(() => assertPostMediaMutable("draft")).not.toThrow();
    expect(() => assertPostMediaMutable("review")).not.toThrow();
  });

  it.each(["approved", "scheduled", "published"] as const)("bloqueia mídia do conteúdo %s", (status) => {
    expect(() => assertPostMediaMutable(status)).toThrow(/imutáveis/i);
  });
});
