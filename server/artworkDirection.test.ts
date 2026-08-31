import { describe, expect, it } from "vitest";
import { buildArtworkPrompt } from "./artworkDirection";

describe("buildArtworkPrompt", () => {
  it("usa o nome institucional padrão quando não há marca cadastrada", () => {
    const prompt = buildArtworkPrompt({
      title: "Novo entendimento do STJ",
      area: "Direito do Consumidor",
      style: "tech_premium",
      brand: null,
    });
    expect(prompt).toContain("Brand: S2 Studio.");
    expect(prompt).toContain("Topic: Novo entendimento do STJ.");
    expect(prompt).toContain("Legal area: Direito do Consumidor.");
  });

  it("personaliza com nome, segmento, público e diretrizes visuais da marca", () => {
    const prompt = buildArtworkPrompt({
      title: "Guarda compartilhada",
      area: "Direito de Família",
      style: "editorial",
      brand: {
        brandName: "Escritório Exemplo",
        segment: "Advocacia de família",
        targetAudience: "Famílias em Belo Horizonte",
        visualGuidelines: "Paleta verde-carvão com bronze,\n  fotografia sóbria e acolhedora",
      },
    });
    expect(prompt).toContain("Brand: Escritório Exemplo.");
    expect(prompt).toContain("Brand segment: Advocacia de família.");
    expect(prompt).toContain("Audience the image must feel welcoming to: Famílias em Belo Horizonte.");
    expect(prompt).toContain(
      "Brand visual guidelines to honor: Paleta verde-carvão com bronze, fotografia sóbria e acolhedora."
    );
  });

  it("mantém as travas de arte limpa e as proibições de texto e clichês", () => {
    const prompt = buildArtworkPrompt({
      title: "Tema",
      area: "Área",
      style: "minimal",
    });
    expect(prompt).toContain("clean and uncluttered with a single clear focal point");
    expect(prompt).toContain("generous intentional negative space");
    expect(prompt).toContain("NO words, NO letters, NO numbers, NO logos");
    expect(prompt).toContain("NO scales of justice, NO gavels");
    expect(prompt).toContain("AVOID: visual clutter");
    expect(prompt).toContain("distorted anatomy or malformed hands");
  });

  it("injeta uma família visual e a política anti-repetição no prompt final", () => {
    const prompt = buildArtworkPrompt({
      title: "Fraude no Pix: primeiras providências",
      area: "Consumidor",
      style: "editorial",
    });
    expect(prompt).toContain("Composition family (");
    expect(prompt).toContain("ANTI-REPETITION:");
    expect(prompt).toContain("magnifying glass");
    expect(prompt).toContain("AI templates");
  });

  it("mantém a mesma família de composição para o mesmo área+tema", () => {
    const first = buildArtworkPrompt({ title: "Licenciamento ambiental", area: "Ambiental", style: "editorial" });
    const second = buildArtworkPrompt({ title: "Licenciamento ambiental", area: "Ambiental", style: "photographic" });
    const family = first.match(/Composition family \(([^)]+)\)/)?.[1];
    expect(family).toBeTruthy();
    expect(second).toContain(`Composition family (${family})`);
  });

  it("inclui a direção adicional informada e trunca textos longos da marca", () => {
    const longGuidelines = "a".repeat(600);
    const prompt = buildArtworkPrompt({
      title: "Tema",
      area: "Área",
      style: "photographic",
      direction: "luz de fim de tarde",
      brand: { brandName: "Marca", visualGuidelines: longGuidelines },
    });
    expect(prompt).toContain("Additional creative direction: luz de fim de tarde.");
    expect(prompt).toContain(`${"a".repeat(500)}…`);
    expect(prompt).not.toContain("a".repeat(501));
  });

  it("ignora diretrizes vazias sem inserir seções órfãs", () => {
    const prompt = buildArtworkPrompt({
      title: "Tema",
      area: "Área",
      style: "tech_premium",
      direction: "   ",
      brand: { brandName: "Marca", segment: "  ", visualGuidelines: null },
    });
    expect(prompt).not.toContain("Brand segment:");
    expect(prompt).not.toContain("Additional creative direction:");
    expect(prompt).not.toContain("Brand visual guidelines to honor:");
  });
});
