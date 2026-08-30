import type { ContentPost } from "../drizzle/schema";

export const INSTAGRAM_LIMITS = {
  captionLength: 2_200,
  hashtagCount: 30,
  mentionCount: 20,
  maxImageBytes: 8 * 1024 * 1024,
  minAspectRatio: 4 / 5,
  maxAspectRatio: 1.91,
  maxCarouselItems: 10,
} as const;

export type PublicationMediaInput = {
  url: string;
  mimeType?: string | null;
  byteSize?: number | null;
  width?: number | null;
  height?: number | null;
};

export type InstagramConnectionInput = {
  state?: string | null;
  instagramUserId?: string | null;
  accessTokenCiphertext?: string | null;
  tokenExpiresAt?: Date | string | null;
} | null;

export type InstagramPreflightInput = {
  post: Pick<ContentPost, "status" | "format" | "sourceId" | "legalSource" | "keyStatement" | "reviewDueAt" | "approvalOwnerName" | "caption" | "cta" | "hashtags" | "altText">;
  media: PublicationMediaInput[];
  connection: InstagramConnectionInput;
  prohibitedTerms?: string | null;
  metaConfigured: boolean;
  origin: string;
  now?: Date;
};

export type InstagramPreflightResult = {
  allowed: boolean;
  issues: string[];
  caption: string;
  mediaUrls: string[];
};

function text(value?: string | null) {
  return value?.trim() ?? "";
}

export function buildInstagramCaption(post: Pick<ContentPost, "caption" | "cta" | "hashtags">) {
  return [text(post.caption), text(post.cta), text(post.hashtags)].filter(Boolean).join("\n\n");
}

export function toPublicHttpsUrl(value: string, origin: string): string | null {
  try {
    const url = new URL(value, origin);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function countTags(caption: string, prefix: "#" | "@") {
  const expression = prefix === "#" ? /(^|\s)#[^\s#]+/g : /(^|\s)@[^\s@]+/g;
  return caption.match(expression)?.length ?? 0;
}

function containsProhibitedTerm(caption: string, prohibitedTerms?: string | null) {
  const lowered = caption.toLocaleLowerCase("pt-BR");
  return (prohibitedTerms ?? "")
    .split(",")
    .map((term) => term.trim().toLocaleLowerCase("pt-BR"))
    .filter(Boolean)
    .find((term) => lowered.includes(term));
}

export function preflightInstagramPublication(input: InstagramPreflightInput): InstagramPreflightResult {
  const issues: string[] = [];
  const now = input.now ?? new Date();
  const caption = buildInstagramCaption(input.post);
  const mediaUrls = input.media.map((media) => toPublicHttpsUrl(media.url, input.origin)).filter((url): url is string => Boolean(url));

  if (!input.metaConfigured) issues.push("as credenciais da aplicação Meta ainda não foram configuradas");
  if (!input.connection || input.connection.state !== "connected" || !input.connection.instagramUserId || !input.connection.accessTokenCiphertext) {
    issues.push("a conta profissional do Instagram não está conectada");
  }
  if (input.connection?.tokenExpiresAt && new Date(input.connection.tokenExpiresAt).getTime() <= now.getTime()) {
    issues.push("o token da conta do Instagram expirou e precisa ser renovado");
  }
  if (input.post.status !== "approved") issues.push("o conteúdo precisa estar aprovado por responsável identificado");
  if (!input.post.sourceId) issues.push("vincule uma fonte da central");
  if (!text(input.post.legalSource)) issues.push("informe a base jurídica ou URL da fonte");
  if (!text(input.post.keyStatement)) issues.push("registre a afirmação-chave que será publicada");
  if (!input.post.reviewDueAt) issues.push("defina a data de revisão do conteúdo");
  if (input.post.reviewDueAt && new Date(input.post.reviewDueAt).getTime() <= now.getTime()) issues.push("a revisão jurídica está vencida");
  if (!text(input.post.approvalOwnerName)) issues.push("registre o responsável pela aprovação");
  if (input.post.format !== "post" && input.post.format !== "carousel") issues.push("esta primeira integração suporta apenas imagem única e carrossel");
  if (!caption) issues.push("inclua uma legenda antes de publicar");
  if (caption.length > INSTAGRAM_LIMITS.captionLength) issues.push("a legenda excede 2.200 caracteres");
  if (countTags(caption, "#") > INSTAGRAM_LIMITS.hashtagCount) issues.push("a legenda excede 30 hashtags");
  if (countTags(caption, "@") > INSTAGRAM_LIMITS.mentionCount) issues.push("a legenda excede 20 menções");
  const prohibitedTerm = containsProhibitedTerm(caption, input.prohibitedTerms);
  if (prohibitedTerm) issues.push(`a legenda contém o termo proibido “${prohibitedTerm}”`);

  if (input.post.format === "post" && input.media.length !== 1) issues.push("uma publicação de imagem única exige exatamente um arquivo JPEG");
  if (input.post.format === "carousel" && (input.media.length < 2 || input.media.length > INSTAGRAM_LIMITS.maxCarouselItems)) {
    issues.push("um carrossel exige entre 2 e 10 imagens JPEG");
  }
  if (input.media.length === 0) issues.push("adicione ao menos uma mídia JPEG à biblioteca do conteúdo");
  if (mediaUrls.length !== input.media.length) issues.push("toda mídia precisa ter URL pública HTTPS");

  input.media.forEach((media, index) => {
    const label = `mídia ${index + 1}`;
    if (media.mimeType !== "image/jpeg") issues.push(`${label} precisa estar no formato JPEG`);
    if (!media.byteSize || media.byteSize > INSTAGRAM_LIMITS.maxImageBytes) issues.push(`${label} precisa ter até 8 MB`);
    if (!media.width || !media.height) {
      issues.push(`${label} precisa ter dimensões verificadas`);
      return;
    }
    const ratio = media.width / media.height;
    if (ratio < INSTAGRAM_LIMITS.minAspectRatio || ratio > INSTAGRAM_LIMITS.maxAspectRatio) {
      issues.push(`${label} deve respeitar a proporção entre 4:5 e 1.91:1`);
    }
  });

  return { allowed: issues.length === 0, issues, caption, mediaUrls };
}
