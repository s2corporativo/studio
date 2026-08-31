import { describe, expect, it } from "vitest";
import { parseHtmlLinks, parseXmlFeed } from "./newsRadar";

describe("Radar Jurídico — origem oficial", () => {
  const htmlSource = {
    kind: "html_links" as const,
    source: "Fonte oficial",
    url: "https://noticias.example.gov.br/",
    area: "Teste",
    weight: 90,
    acceptedPathFragments: ["/noticias/"],
  };

  it("descarta links externos mesmo quando contêm o caminho aceito", () => {
    const html = '<a href="https://externo.example/noticias/alerta">Notícia externa que não deve entrar</a>';
    expect(parseHtmlLinks(html, htmlSource)).toEqual([]);
  });

  it("preserva links HTTPS da própria fonte oficial", () => {
    const html = '<a href="/noticias/decisao-relevante">Decisão relevante da fonte oficial</a>';
    expect(parseHtmlLinks(html, htmlSource)).toHaveLength(1);
  });

  it("não propaga link XML externo como destino de leitura", () => {
    const xml = '<rss><channel><item><title>Julgado relevante para acompanhamento</title><link>https://externo.example/post</link></item></channel></rss>';
    const source = { kind: "xml" as const, source: "Fonte oficial", url: "https://tribunal.example.gov.br/feed", area: "Teste", weight: 90 };
    const [item] = parseXmlFeed(xml, source);
    expect(item.url).toBe(source.url);
  });
});
