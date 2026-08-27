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

const OFFICIAL_FEEDS = [
  {
    source: "STJ Notícias",
    url: "https://res.stj.jus.br/hrestp-c-portalp/RSS.xml",
    area: "Cível e Consumidor",
    weight: 92,
  },
  {
    source: "STJ — Informativo de Jurisprudência",
    url: "https://processo.stj.jus.br/jurisprudencia/externo/InformativoFeed",
    area: "Jurisprudência",
    weight: 97,
  },
  {
    source: "STJ — Jurisprudência em Teses",
    url: "https://scon.stj.jus.br/SCON/JurisprudenciaEmTesesFeed",
    area: "Jurisprudência",
    weight: 95,
  },
  {
    source: "TRT-MG — Jurisprudência",
    url: "https://sistemas.trt3.jus.br/bd-trt3/feed/rss_2.0/11103/4",
    area: "Trabalhista",
    weight: 94,
  },
] as const;

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block: string, name: string) {
  const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function atomLink(block: string) {
  const match = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
  return match?.[1] ?? "";
}

function parseFeed(xml: string, feed: (typeof OFFICIAL_FEEDS)[number]): RadarItem[] {
  const blocks = [
    ...(xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? []),
    ...(xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? []),
  ];

  return blocks.slice(0, 12).map((block, index) => {
    const title = tag(block, "title");
    const link = tag(block, "link") || atomLink(block);
    const published = tag(block, "pubDate") || tag(block, "published") || tag(block, "updated");
    const summary = tag(block, "description") || tag(block, "summary") || tag(block, "content") || null;
    const timeBonus = published && !Number.isNaN(Date.parse(published))
      ? Math.max(0, 7 - Math.floor((Date.now() - Date.parse(published)) / 86_400_000))
      : 0;
    return {
      id: `${feed.source}-${index}-${Buffer.from(link || title).toString("base64url").slice(0, 18)}`,
      source: feed.source,
      sourceUrl: feed.url,
      title,
      url: link || feed.url,
      publishedAt: published && !Number.isNaN(Date.parse(published)) ? new Date(published).toISOString() : null,
      summary,
      area: feed.area,
      score: Math.min(100, feed.weight + timeBonus),
    };
  }).filter(item => item.title.length >= 8);
}

export async function fetchCurrentRadar() {
  const results = await Promise.allSettled(OFFICIAL_FEEDS.map(async feed => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch(feed.url, {
        headers: { "user-agent": "DePaula-Social-OS/1.0 (+https://depaulateixeira.adv.br)" },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return parseFeed(await response.text(), feed);
    } finally {
      clearTimeout(timeout);
    }
  }));

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
    .slice(0, 24);
}
