import { cn } from "@/lib/utils";
import { Images, Layers3, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

type Asset = {
  id: number;
  url: string;
  fileName: string;
  area: string;
  title: string;
  assetType: "single" | "carousel_slide";
  groupKey: string | null;
  slideOrder: number | null;
  tags: string | null;
  width: number;
  height: number;
};

function titleCase(value: string) {
  return value.replace(/^carrossel_\d+_/, "").split("_").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" · ");
}

export default function AssetLibrary({ assets }: { assets: Asset[] }) {
  const [area, setArea] = useState("Todas as áreas");
  const [query, setQuery] = useState("");
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const areas = useMemo(() => ["Todas as áreas", ...Array.from(new Set(assets.map((asset) => asset.area))).sort((a, b) => a.localeCompare(b, "pt-BR"))], [assets]);
  const visible = useMemo(() => assets.filter((asset) => {
    const haystack = `${asset.area} ${asset.title} ${asset.tags ?? ""} ${asset.fileName}`.toLocaleLowerCase("pt-BR");
    return (area === "Todas as áreas" || asset.area === area) && haystack.includes(query.toLocaleLowerCase("pt-BR"));
  }), [area, assets, query]);
  const singles = visible.filter((asset) => asset.assetType === "single");
  const groups = Array.from(visible.filter((asset) => asset.assetType === "carousel_slide").reduce((map, asset) => {
    const key = asset.groupKey ?? `carousel-${asset.id}`;
    map.set(key, [...(map.get(key) ?? []), asset].sort((a, b) => (a.slideOrder ?? 0) - (b.slideOrder ?? 0)));
    return map;
  }, new Map<string, Asset[]>()).entries()).sort(([a], [b]) => a.localeCompare(b, "pt-BR"));

  return <div className="space-y-7">
    <section className="editorial-panel rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="tiny-kicker">Acervo visual institucional</p><h2 className="mt-2 font-serif text-3xl text-[#f1e8d9]">Artes prontas, com história preservada.</h2><p className="mt-2 max-w-2xl text-xs leading-5 text-[#9aa69f]">{assets.length} artes importadas do acervo do escritório. Cada arquivo permanece organizado por área, tema e sequência original.</p></div>
        <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider"><span className="rounded-full border border-[#d8ad68]/25 bg-[#c99550]/10 px-3 py-2 text-[#e3bd7f]"><Images className="mr-1 inline h-3.5 w-3.5" />{singles.length} individuais</span><span className="rounded-full border border-[#8bb6a0]/20 bg-emerald-300/5 px-3 py-2 text-emerald-100"><Layers3 className="mr-1 inline h-3.5 w-3.5" />{groups.length} sequências</span></div>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-[220px_1fr]"><select aria-label="Filtrar artes por área" className="editorial-input" value={area} onChange={(event) => { setArea(event.target.value); setOpenGroup(null); }}>{areas.map((item) => <option className="bg-[#12221e]" key={item}>{item}</option>)}</select><label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/15 px-3 text-[#99a79f]"><Search className="h-4 w-4" /><input aria-label="Buscar nas artes" className="min-w-0 flex-1 bg-transparent py-2 text-xs text-[#eee6db] outline-none placeholder:text-[#728078]" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por tema, área ou arquivo" />{query && <button type="button" onClick={() => setQuery("")} className="text-[#d6ac69]" aria-label="Limpar busca"><X className="h-4 w-4" /></button>}</label></div>
    </section>

    {groups.length > 0 && <section className="editorial-panel rounded-2xl p-5 sm:p-6"><div className="flex items-end justify-between gap-4"><div><p className="tiny-kicker">Sequências de carrossel</p><h2 className="mt-2 font-serif text-2xl">Conteúdo em sequência</h2></div><span className="text-xs text-[#9ba89f]">{groups.length} carrosséis</span></div><div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{groups.map(([key, slides]) => { const open = openGroup === key; const cover = slides[0]; return <article key={key} className="overflow-hidden rounded-xl border border-white/8 bg-black/10"><button type="button" onClick={() => setOpenGroup(open ? null : key)} className="group block w-full text-left"><div className="relative h-[245px] overflow-hidden bg-[#10201b]"><img src={cover.url} alt={`Capa: ${cover.title}`} className="h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.02] group-hover:opacity-100" /><span className="absolute bottom-3 left-3 rounded-full border border-white/15 bg-[#0d1916]/85 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#f0d29d]">{slides.length} lâminas</span></div><div className="p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-[#cda666]">{cover.area}</p><h3 className="mt-1 font-serif text-xl leading-tight text-[#f0e8db]">{cover.title}</h3><p className="mt-2 text-[10px] text-[#96a198]">{open ? "Ocultar sequência" : `Abrir sequência · ${titleCase(key)}`}</p></div></button>{open && <div className="grid grid-cols-3 gap-2 border-t border-white/8 p-3">{slides.map((slide) => <figure key={slide.id} className="overflow-hidden rounded-md bg-[#10201b]"><img src={slide.url} alt={`${slide.title}, lâmina ${slide.slideOrder}`} className="aspect-[4/5] w-full object-cover" /><figcaption className="px-1.5 py-1 text-[9px] text-[#a9b4ab]">{String(slide.slideOrder).padStart(2, "0")}</figcaption></figure>)}</div>}</article>; })}</div></section>}

    <section className="editorial-panel rounded-2xl p-5 sm:p-6"><div className="flex items-end justify-between gap-4"><div><p className="tiny-kicker">Artes individuais</p><h2 className="mt-2 font-serif text-2xl">Peças de feed prontas</h2></div><span className="text-xs text-[#9ba89f]">{singles.length} resultados</span></div>{singles.length === 0 ? <div className="mt-6 border-t border-white/8 py-10 text-center text-xs text-[#9ca8a0]">Nenhuma arte corresponde ao filtro selecionado.</div> : <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{singles.map((asset) => <article key={asset.id} className="group overflow-hidden rounded-xl border border-white/8 bg-black/10"><div className="relative aspect-[4/5] overflow-hidden bg-[#10201b]"><img src={asset.url} alt={asset.title} className="h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.025] group-hover:opacity-100" /></div><div className="p-3"><p className="truncate text-[9px] font-bold uppercase tracking-wider text-[#d1a964]">{asset.area}</p><h3 className="mt-1 line-clamp-2 font-serif text-base leading-tight text-[#eee6d9]">{asset.title}</h3></div></article>)}</div>}</section>
  </div>;
}
