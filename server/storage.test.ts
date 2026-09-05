import { describe, expect, it } from "vitest";
import { normalizeStorageKey } from "./storage";

describe("storage key validation", () => {
  it("normalizes an absolute-style project key", () => {
    expect(normalizeStorageKey("/social-studio/7/posts/3/arte.jpg")).toBe("social-studio/7/posts/3/arte.jpg");
  });

  it("rejects traversal, backslashes and control characters", () => {
    expect(() => normalizeStorageKey("social-studio/7/../secret.txt")).toThrow(/inválida/);
    expect(() => normalizeStorageKey("social-studio\\secret.txt")).toThrow(/inválida/);
    expect(() => normalizeStorageKey("social-studio/secret\u0000.txt")).toThrow(/inválida/);
  });
});
