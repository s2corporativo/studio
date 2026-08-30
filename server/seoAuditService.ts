import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

function isPrivateIpv4(ip: string) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return true;
  const [a, b] = parts;
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
}

function isPrivateAddress(address: string) {
  if (isIP(address) === 4) return isPrivateIpv4(address);
  const normalized = address.toLowerCase();
  return normalized === "::1" || normalized === "::" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb");
}

async function assertPublicHttpsUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("A auditoria aceita somente URLs HTTPS públicas.");
  if (url.username || url.password) throw new Error("URLs com credenciais embutidas não são permitidas.");
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".local")) throw new Error("Hosts locais não são permitidos.");
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(item => isPrivateAddress(item.address))) throw new Error("O domínio resolve para endereço privado ou não permitido.");
  return url;
}

function decodeEntities(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}

function stripTags(value: string) {
  return decodeEntities(value.replace(/<script\b[\s\S]*?<\/script>/gi, " ").replace(/<style\b[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
}

function firstMatch(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return match?.[1] ? decodeEntities(match[1]) : null;
}

function metaContent(html: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${escaped}["'][^>]*>`, "i"),
  ];
  for (const pattern of patterns) {
    const value = firstMatch(html, pattern);
    if (value !== null) return value;
  }
  return null;
}

function linkHref(html: string, rel: string) {
  const escaped = rel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return firstMatch(html, new RegExp(`<link[^>]+rel=["'][^"']*${escaped}[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>`, "i"))
    ?? firstMatch(html, new RegExp(`<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*${escaped}[^"']*["'][^>]*>`, "i"));
}

function countMatches(html: string, pattern: RegExp) {
  return html.match(pattern)?.length ?? 0;
}

function imageAltStats(html: string) {
  const images = html.match(/<img\b[^>]*>/gi) ?? [];
  let missing = 0;
  for (const image of images) {
    const alt = image.match(/\balt=["']([^"']*)["']/i)?.[1];
    if (alt === undefined || alt.trim() === "") missing += 1;
  }
  return { total: images.length, missingAlt: missing };
}

function linkStats(html: string, origin: string) {
  const anchors = html.match(/<a\b[^>]+href=["'][^"']+["'][^>]*>/gi) ?? [];
  let internal = 0;
  let external = 0;
  for (const anchor of anchors) {
    const href = anchor.match(/href=["']([^"']+)["']/i)?.[1];
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;
    try {
      const parsed = new URL(href, origin);
      parsed.origin === origin ? internal++ : external++;
    } catch {
      continue;
    }
  }
  return { internal, external };
}

export async function auditSeoPage(targetUrl: string, location?: string | null, keyword?: string | null) {
  const url = await assertPublicHttpsUrl(targetUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "SocialStudio-SEO-Audit/1.0", accept: "text/html,application/xhtml+xml" },
    });
    if (!response.ok) throw new Error(`A página retornou HTTP ${response.status}.`);
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("text/html")) throw new Error("A URL não retornou uma página HTML.");
    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > 2_500_000) throw new Error("A página é grande demais para a auditoria segura.");
    const html = (await response.text()).slice(0, 2_500_000);
    const finalUrl = new URL(response.url || url.toString());

    const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const description = metaContent(html, "description");
    const robots = metaContent(html, "robots");
    const canonical = linkHref(html, "canonical");
    const viewport = metaContent(html, "viewport");
    const h1 = countMatches(html, /<h1\b[^>]*>/gi);
    const h2 = countMatches(html, /<h2\b[^>]*>/gi);
    const schemaBlocks = countMatches(html, /<script[^>]+type=["']application\/ld\+json["'][^>]*>/gi);
    const images = imageAltStats(html);
    const links = linkStats(html, finalUrl.origin);
    const visibleText = stripTags(html).toLocaleLowerCase("pt-BR");
    const keywordPresent = keyword ? visibleText.includes(keyword.toLocaleLowerCase("pt-BR")) : null;
    const locationPresent = location ? visibleText.includes(location.toLocaleLowerCase("pt-BR")) : null;

    const findings: Array<{ key: string; severity: "ok" | "warning" | "critical"; detail: string }> = [];
    let score = 100;
    const penalize = (points: number) => { score = Math.max(0, score - points); };

    if (!title) { findings.push({ key: "title", severity: "critical", detail: "A página não possui <title>." }); penalize(18); }
    else if (title.length < 25 || title.length > 65) { findings.push({ key: "title", severity: "warning", detail: `Título com ${title.length} caracteres; revise clareza e tamanho.` }); penalize(5); }
    else findings.push({ key: "title", severity: "ok", detail: `Título detectado com ${title.length} caracteres.` });

    if (!description) { findings.push({ key: "description", severity: "critical", detail: "Meta description não encontrada." }); penalize(14); }
    else if (description.length < 70 || description.length > 170) { findings.push({ key: "description", severity: "warning", detail: `Meta description com ${description.length} caracteres.` }); penalize(4); }
    else findings.push({ key: "description", severity: "ok", detail: "Meta description presente." });

    if (h1 !== 1) { findings.push({ key: "h1", severity: h1 === 0 ? "critical" : "warning", detail: `Foram encontrados ${h1} elementos H1.` }); penalize(h1 === 0 ? 12 : 5); }
    else findings.push({ key: "h1", severity: "ok", detail: "Um H1 encontrado." });

    if (!canonical) { findings.push({ key: "canonical", severity: "warning", detail: "Canonical não encontrado." }); penalize(5); }
    else findings.push({ key: "canonical", severity: "ok", detail: `Canonical: ${canonical}` });

    if (!viewport) { findings.push({ key: "viewport", severity: "critical", detail: "Meta viewport não encontrada." }); penalize(12); }
    else findings.push({ key: "viewport", severity: "ok", detail: "Viewport responsivo declarado." });

    if (/noindex/i.test(robots ?? "")) { findings.push({ key: "indexing", severity: "critical", detail: "A página declara noindex." }); penalize(25); }
    else findings.push({ key: "indexing", severity: "ok", detail: "Nenhum noindex foi detectado no HTML." });

    if (images.total > 0 && images.missingAlt > 0) { findings.push({ key: "images", severity: "warning", detail: `${images.missingAlt} de ${images.total} imagens sem alt útil.` }); penalize(Math.min(10, images.missingAlt)); }
    else findings.push({ key: "images", severity: "ok", detail: `${images.total} imagens analisadas; nenhuma ausência de alt detectada.` });

    if (schemaBlocks === 0) { findings.push({ key: "structured_data", severity: "warning", detail: "Nenhum bloco JSON-LD detectado no HTML." }); penalize(6); }
    else findings.push({ key: "structured_data", severity: "ok", detail: `${schemaBlocks} bloco(s) JSON-LD detectado(s).` });

    if (keyword && !keywordPresent) { findings.push({ key: "keyword", severity: "warning", detail: `A expressão "${keyword}" não foi localizada no texto visível.` }); penalize(5); }
    if (location && !locationPresent) { findings.push({ key: "local", severity: "warning", detail: `A localização "${location}" não foi localizada no texto visível.` }); penalize(5); }

    const recommendations = findings.filter(item => item.severity !== "ok").map(item => {
      const mapping: Record<string, string> = {
        title: "Ajuste o title para representar a intenção de busca e o conteúdo real da página.",
        description: "Crie uma meta description específica, útil e coerente com a página.",
        h1: "Mantenha um H1 principal claro e hierarquia semântica coerente.",
        canonical: "Defina canonical autorreferente ou para a URL canônica correta.",
        viewport: "Inclua meta viewport adequada para responsividade.",
        indexing: "Confirme se noindex é intencional antes de removê-lo.",
        images: "Adicione textos alt descritivos somente onde a imagem transmite informação.",
        structured_data: "Avalie dados estruturados compatíveis com o conteúdo real, sem marcar informação inexistente.",
        keyword: "Revise a cobertura semântica da intenção de busca, sem repetição artificial de palavras-chave.",
        local: "Se a página tiver finalidade local, inclua localização e área atendida de forma natural e verdadeira.",
      };
      return mapping[item.key] ?? item.detail;
    });

    return {
      finalUrl: finalUrl.toString(),
      score,
      findings,
      recommendations,
      facts: { title, description, canonical, robots, viewport, h1, h2, schemaBlocks, images, links, keywordPresent, locationPresent },
    };
  } finally {
    clearTimeout(timeout);
  }
}
