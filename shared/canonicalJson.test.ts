import { describe, expect, it } from "vitest";
import { canonicalJson } from "./canonicalJson";

describe("canonicalJson", () => {
  it("gera a mesma serialização independentemente da ordem das chaves", () => {
    expect(canonicalJson({ b: 2, a: { z: 3, y: 1 } })).toBe(canonicalJson({ a: { y: 1, z: 3 }, b: 2 }));
  });

  it("preserva ordem de arrays e ignora propriedades undefined", () => {
    expect(canonicalJson({ list: [2, 1], optional: undefined })).toBe('{"list":[2,1]}');
  });
});
