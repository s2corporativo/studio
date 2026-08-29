import { describe, expect, it } from "vitest";
import { isValidStudioKey, normalizeStudioStorageKey, safeHttpsUrl } from "../storagePolicy";

describe("storage boundaries", () => {
  it("accepts only Studio-owned storage keys", () => {
    expect(isValidStudioKey("social-studio/123/posts/image.jpg")).toBe(true);
    expect(isValidStudioKey("social-studio/123/conhecimento/material.pdf")).toBe(true);
    expect(isValidStudioKey("other-system/private/file.pdf")).toBe(false);
    expect(isValidStudioKey("social-studio/../other-system/file.pdf")).toBe(false);
    expect(isValidStudioKey("social-studio/123/./file.pdf")).toBe(false);
    expect(isValidStudioKey("social-studio\\123\\file.pdf")).toBe(false);
    expect(isValidStudioKey("social-studio/123/file\0.pdf")).toBe(false);
  });

  it("normalizes a leading slash without allowing namespace escape", () => {
    expect(normalizeStudioStorageKey("/social-studio/123/posts/image.jpg")).toBe("social-studio/123/posts/image.jpg");
    expect(() => normalizeStudioStorageKey("/other-system/file.jpg")).toThrow();
  });

  it("accepts only valid HTTPS signed URLs", () => {
    expect(safeHttpsUrl("https://storage.example.com/object?signature=abc")?.protocol).toBe("https:");
    expect(safeHttpsUrl("http://storage.example.com/object")).toBeNull();
    expect(safeHttpsUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpsUrl("not-a-url")).toBeNull();
    expect(safeHttpsUrl(null)).toBeNull();
  });
});
