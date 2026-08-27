import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ImagePlus, Loader2, WandSparkles } from "lucide-react";
import { useState } from "react";

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || ctx.measureText(candidate).width <= maxWidth) current = candidate;
    else {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.join(" ").split(" ").length < words.length && lines.length) lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[.…]+$/, "")}…`;
  return lines;
}

function renderBrandOverlay(ctx: CanvasRenderingContext2D, post: any, style: string) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const accent = style === "tech_premium" ? "#8b5cf6" : style === "minimal" ? "#cbd5e1" : "#d8b476";
  const overlay = ctx.createLinearGradient(0, height * 0.15, 0, height);
  overlay.addColorStop(0, "rgba(2,6,23,.03)");
  overlay.addColorStop(0.5, "rgba(2,6,23,.34)");
  overlay.addColorStop(1, "rgba(2,6,23,.96)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(7,11,20,.8)";
  ctx.beginPath();
  ctx.roundRect(70, 70, 270, 52, 26);
  ctx.fill();
  ctx.strokeStyle = `${accent}99`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.font = "700 22px Arial, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(String(post.area ?? "DIREITO").toLocaleUpperCase("pt-BR").slice(0, 25), 96, 96);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#fff";
  ctx.font = "700 70px Arial, sans-serif";
  const titleLines = wrapText(ctx, String(post.title ?? "Conteúdo jurídico"), 900, 4);
  let y = 790 - Math.max(0, titleLines.length - 2) * 58;
  for (const line of titleLines) {
    ctx.fillText(line, 78, y);
    y += 78;
  }

  const hook = String(post.hook ?? post.keyStatement ?? "").trim();
  if (hook) {
    ctx.fillStyle = "rgba(226,232,240,.9)";
    ctx.font = "400 30px Arial, sans-serif";
    y += 15;
    for (const line of wrapText(ctx, hook, 850, 2)) {
      ctx.fillText(line, 80, y);
      y += 42;
    }
  }

  ctx.fillStyle = accent;
  ctx.fillRect(78, 1184, 70, 5);
  ctx.fillStyle = "#f8fafc";
  ctx.font = "700 24px Arial, sans-serif";
  ctx.fillText("DE PAULA TEIXEIRA", 78, 1240);
  ctx.fillStyle = "rgba(148,163,184,.92)";
  ctx.font = "500 18px Arial, sans-serif";
  ctx.fillText("ADVOCACIA • CONTEÚDO INFORMATIVO", 78, 1275);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "700 34px Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("DP", width - 78, 1256);
  ctx.textAlign = "left";
}

export default function ArtworkStudio({ post }: { post: any }) {
  const [style, setStyle] = useState<"tech_premium" | "editorial" | "photographic" | "minimal">("tech_premium");
  const [direction, setDirection] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const generate = trpc.socialStudio.generatePostArtwork.useMutation({
    onSuccess: data => {
      setPreviewUrl(data.url);
      setMessage("Conceito visual gerado. A tipografia e a assinatura serão aplicadas pelo Design Engine.");
    },
    onError: error => setMessage(error.message),
  });
  const upload = trpc.socialStudio.uploadPostMedia.useMutation({
    onSuccess: async () => {
      setMessage("Arte final 1080×1350 adicionada ao post e pronta para o fluxo de publicação.");
      await utils.socialStudio.data.invalidate();
    },
    onError: error => setMessage(error.message),
  });

  async function attach() {
    if (!previewUrl) return;
    try {
      setMessage("Renderizando arte final em JPEG...");
      const response = await fetch(previewUrl);
      if (!response.ok) throw new Error("Não foi possível carregar a imagem gerada.");
      const bitmap = await createImageBitmap(await response.blob());
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("O navegador não conseguiu preparar a arte.");
      const scale = Math.max(canvas.width / bitmap.width, canvas.height / bitmap.height);
      const drawWidth = bitmap.width * scale;
      const drawHeight = bitmap.height * scale;
      ctx.drawImage(bitmap, (canvas.width - drawWidth) / 2, (canvas.height - drawHeight) / 2, drawWidth, drawHeight);
      renderBrandOverlay(ctx, post, style);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.94));
      if (!blob) throw new Error("Não foi possível converter a arte para JPEG.");
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      upload.mutate({ postId: post.id, fileName: `arte-ia-${post.id}.jpg`, mimeType: "image/jpeg", base64 });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao preparar a arte.");
    }
  }

  return <section className="saas-card p-5 sm:p-6">
    <div className="flex items-start justify-between gap-4">
      <div><div className="saas-eyebrow"><WandSparkles className="h-3.5 w-3.5" /> Design AI</div><h3 className="mt-3 text-xl font-semibold text-white">Criação visual profissional</h3><p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">A IA cria o conceito visual sem texto; o sistema monta título, área e assinatura com precisão, evitando a aparência típica de arte gerada integralmente por IA.</p></div>
      <ImagePlus className="h-5 w-5 text-violet-300" />
    </div>
    <div className="mt-5 grid gap-3 md:grid-cols-[220px_1fr_auto]">
      <select className="editorial-input" value={style} onChange={event => setStyle(event.target.value as typeof style)}><option value="tech_premium">SaaS tech premium</option><option value="editorial">Editorial sofisticado</option><option value="photographic">Fotográfico realista</option><option value="minimal">Minimal premium</option></select>
      <input className="editorial-input" value={direction} onChange={event => setDirection(event.target.value)} placeholder="Direção opcional: ambiente, textura, fotografia..." />
      <Button onClick={() => generate.mutate({ postId: post.id, style, direction: direction || null })} disabled={generate.isPending} className="saas-button-primary">{generate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}Gerar</Button>
    </div>
    {previewUrl && <div className="mt-5 grid gap-4 lg:grid-cols-[260px_1fr]"><img src={previewUrl} alt="Conceito visual gerado por IA" className="aspect-[4/5] w-full rounded-2xl object-cover" /><div className="flex flex-col justify-center"><p className="text-sm font-semibold text-slate-200">Conceito visual pronto</p><p className="mt-2 text-xs leading-5 text-slate-500">Ao confirmar, o Design Engine recorta para 4:5, aplica a composição institucional e envia um JPEG validado para a mídia do post.</p><Button onClick={attach} disabled={upload.isPending} variant="outline" className="saas-button-secondary mt-4 w-fit">{upload.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Usar no post</Button></div></div>}
    {message && <p className="mt-4 text-xs leading-5 text-slate-400">{message}</p>}
  </section>;
}
