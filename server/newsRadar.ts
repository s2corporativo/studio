export type RadarItem = {
  id: string;
  source: string;
  sourceUrl: string;
  title: string;
  url: string;
  publishedAt: string | null;
  summary: string | null;
  area: string;
  score: number;
};

type XmlSource = {
  kind: "xml";
  source: string;
  url: string;
  area: string;
  weight: number;
  allowedHosts?: string[];
};

type HtmlLinkSource = {
  kind: "html_links";
  source: string;
  url: string;
  area: string;
  weight: number;
  acceptedPathFragments: string[];
  allowedHosts?: string[];
};

type OfficialSource = XmlSource | HtmlLinkSource;

const OFFICIAL_SOURCES: OfficialSource[] = [
  {
    kind: "xml",
    source: "STJ Notícias",
    url: "https://res.stj.jus.br/hrestp-c-portalp/RSS.xml",
    area: "Cível e Consumidor",
    weight: 92,
    allowedHosts: ["www.stj.jus.br", "processo.stj.jus.br", "scon.stj.jus.br"],
  },
  {
    kind: "xml",
    source: "STJ — Informativo de Jurisprudência",
    url: "https://processo.stj.jus.br/jurisprudencia/externo/InformativoFeed",
    area: "Jurisprudência",
    weight: 97,
    allowedHosts: ["www.stj.jus.br", "scon.stj.jus.br"],
  },
  {
    kind: "xml",
    source: "STJ — Jurisprudência em Teses",
    url: "https://scon.stj.jus.br/SCON/JurisprudenciaEmTesesFeed",
    area: "Jurisprudência",
    weight: 95,
    allowedHosts: ["www.stj.jus.br", "processo.stj.jus.br"],
  },
  {
    kind: "xml",
    source: "TRT-MG — Jurisprudência",
    url: "https://sistemas.trt3.jus.br/bd-trt3/feed/rss_2.0/11103/4",
    area: "Trabalhista",
    weight: 94,
  },
  {
    kind: "html_links",
    source: "STF Notícias",
    url: "https://noticias.stf.jus.br/",
    area: "Constitucional",
    weight: 96,
    acceptedPathFragments: ["/postsnoticias/"],
  },
  {
    kind: "html_links",
    source: "TST Notícias",
    url: "https://www.tst.jus.br/noticias",
    area: "Trabalhista",
    weight: 95,
    acceptedPathFragments: ["/-/"],
  },
];

function decodeMarkup(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block: string, name: string) {
  const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
  return match ? decodeMarkup(match[1]) : "";
}

function atomLink(block: string) {
  const match = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
  return match?.[1] ?? "";
}

function itemId(source: string, index: number, seed: string) {
  return `${source}-${index}-${Buffer.from(seed).toString("base64url").slice(0, 18)}`;
}

function isAllowedSourceUrl(candidate: string, source: OfficialSource) {
  try {
    const url = new URL(candidate, source.url);
    const sourceUrl = new URL(source.url);
    const allowedHosts = new Set([sourceUrl.hostname, ...(source.allowedHosts ?? [])]);
    return url.protocol === "https:" && allowedHosts.has(url.hostname);
  } catch {
    return false;
  }
}

export function parseXmlFeed(xml: string, source: XmlSource): RadarItem[] {
  const blocks = [
    ...(xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? []),
    ...(xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? []),
  ];

  return blocks.slice(0, 12).map((block, index) => {
    const title = tag(block, "title");
    const rawLink = tag(block, "link") || atomLink(block);
    const link = isAllowedSourceUrl(rawLink, source) ? new URL(rawLink, source.url).toString() : "";
    const published = tag(block, "pubDate") || tag(block, "published") || tag(block, "updated");
    const summary = tag(block, "description") || tag(block, "summary") || tag(block, "content") || null;
    const parsedDate = published && !Number.isNaN(Date.parse(published)) ? Date.parse(published) : null;
    const timeBonus = parsedDate
      ? Math.max(0, 7 - Math.floor((Date.now() - parsedDate) / 86_400_000))
      : 0;
    return {
      id: itemId(source.source, index, link || title),
      source: source.source,
      sourceUrl: source.url,
      title,
      url: link || source.url,
      publishedAt: parsedDate ? new Date(parsedDate).toISOString() : null,
      summary,
      area: source.area,
      score: Math.min(100, source.weight + timeBonus),
    };
  }).filter(item => item.title.length >= 8);
}

export function parseHtmlLinks(html: string, source: HtmlLinkSource): RadarItem[] {
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const found: RadarItem[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = anchorPattern.exec(html)) && found.length < 12) {
    const href = match[1]?.trim();
    const title = decodeMarkup(match[2] ?? "");
    if (!href || title.length < 12) continue;
    if (/^(saiba mais|leia mais|notícias|noticias|início|inicio|menu)$/i.test(title)) continue;

    let url: string;
    try {
      url = new URL(href, source.url).toString();
    } catch {
      continue;
    }

    const parsed = new URL(url);
    if (!isAllowedSourceUrl(url, source)) continue;
    if (!source.acceptedPathFragments.some(fragment => parsed.pathname.includes(fragment))) continue;
    if (seen.has(url)) continue;
    seen.add(url);

    found.push({
      id: itemId(source.source, found.length, url),
      source: source.source,
      sourceUrl: source.url,
      title,
      url,
      publishedAt: null,
      summary: null,
      area: source.area,
      score: source.weight,
    });
  }

  return found;
}

async function fetchSource(source: OfficialSource) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(source.url, {
      headers: {
        "user-agent": "S2-Studio/1.1 (+https://s2.studio)",
        accept: source.kind === "xml"
          ? "application/rss+xml, application/atom+xml, application/xml, text/xml, */*"
          : "text/html,application/xhtml+xml,*/*",
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const body = await response.text();
    return source.kind === "xml" ? parseXmlFeed(body, source) : parseHtmlLinks(body, source);
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchCurrentRadar() {
  const results = await Promise.allSettled(OFFICIAL_SOURCES.map(fetchSource));
  const items = results.flatMap(result => result.status === "fulfilled" ? result.value : []);
  const seen = new Set<string>();

  return items
    .filter(item => {
      const key = item.url || item.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.score - a.score || (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .slice(0, 36);
}
