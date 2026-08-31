import { describe, expect, it } from "vitest";
import { buildInstagramCaption, preflightInstagramPublication } from "./instagramRules";

const approvedPost = {
  status: "approved" as const,
  format: "post" as const,
  sourceId: 1,
  legalSource: "https://www.planalto.gov.br/",
  keyStatement: "Informação jurídica revisada.",
  reviewDueAt: new Date("2026-09-30T12:00:00Z"),
  approvalOwnerName: "Responsável jurídico",
  caption: "Conteúdo informativo, sem promessa de resultado.",
  cta: "Consulte orientação jurídica adequada ao seu caso.",
  hashtags: "#Direito #InformacaoJuridica",
  altText: "Arte institucional em verde e bronze.",
};

const validMedia = [{ url: "/manus-storage/social-studio/post.jpg", mimeType: "image/jpeg", byteSize: 700_000, width: 1080, height: 1350 }];
const validConnection = { state: "connected", instagramUserId: "ig-123", accessTokenCiphertext: "cipher", tokenExpiresAt: new Date("2026-09-25T12:00:00Z") };
const baseInput = { post: approvedPost, media: validMedia, connection: validConnection, metaConfigured: true, origin: "https://studio.example.com", now: new Date("2026-08-27T12:00:00Z") };

describe("regras de pré-publicação do Instagram", () => {
  it("monta uma legenda única a partir de texto, CTA e hashtags", () => {
    expect(buildInstagramCaption(approvedPost)).toContain("#Direito");
  });

  it("libera imagem aprovada, revisada e tecnicamente compatível", () => {
    expect(preflightInstagramPublication(baseInput).allowed).toBe(true);
  });

  it("bloqueia conteúdo sem aprovação humana e fonte", () => {
    const result = preflightInstagramPublication({ ...baseInput, post: { ...approvedPost, status: "draft", sourceId: null, approvalOwnerName: null } });
    expect(result.allowed).toBe(false);
    expect(result.issues.join(" ")).toContain("aprovado");
    expect(result.issues.join(" ")).toContain("fonte");
  });

  it("bloqueia conexão ausente e mídia que não seja JPEG público", () => {
    const result = preflightInstagramPublication({ ...baseInput, connection: null, media: [{ ...validMedia[0], url: "http://localhost/post.png", mimeType: "image/png" }] });
    expect(result.allowed).toBe(false);
    expect(result.issues.join(" ")).toContain("conta profissional");
    expect(result.issues.join(" ")).toContain("JPEG");
    expect(result.issues.join(" ")).toContain("HTTPS");
  });

  it("exige de duas a dez imagens para carrossel", () => {
    const result = preflightInstagramPublication({ ...baseInput, post: { ...approvedPost, format: "carousel" }, media: validMedia });
    expect(result.allowed).toBe(false);
    expect(result.issues.join(" ")).toContain("2 e 10");
  });
});
