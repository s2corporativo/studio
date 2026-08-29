import { describe, expect, it } from "vitest";
import { isValidStudioKey, safeRedirectUrl } from "./storageProxy";

describe("storage proxy boundaries", () => {
  it("accepts only Studio-owned storage keys", () => {
    expect(isValidStudioKey("social-studio/123/posts/image.jpg")).toBe(true);
    expect(isValidStudioKey("social-studio/123/conhecimento/material.pdf")).toBe(true);
    expect(isValidStudioKey("other-system/private/file.pdf")).toBe(false);
    expect(isValidStudioKey("social-studio/../other-system/file.pdf")).toBe(false);
    expect(isValidStudioKey("social-studio/123/./file.pdf")).toBe(false);
    expect(isValidStudioKey("social-studio\\123\\file.pdf")).toBe(false);
    expect(isValidStudioKey("social-studio/123/file\0.pdf")).toBe(false);
  });

  it("accepts only valid HTTPS signed redirects", () => {
    expect(safeRedirectUrl("https://storage.example.com/object?signature=abc")?.protocol).toBe("https:");
    expect(safeRedirectUrl("http://storage.example.com/object")).toBeNull();
    expect(safeRedirectUrl("javascript:alert(1)")).toBeNull();
    expect(safeRedirectUrl("not-a-url")).toBeNull();
    expect(safeRedirectUrl(null)).toBeNull();
  });
});
