import { z } from "zod";
import { contentStatuses, editorialFormats } from "../../drizzle/schema";
import { canSubmitForReview } from "../studioRules";
import { generateLegalDraft } from "../socialStudioGenerator";
import { createContentSource, createHashtagGroup, createKnowledgeMaterial, createSocialProfile, createStudioPost, getHashtagGroups, getInstagramStudioData, getOrCreateContentSource, getPostMedia, getPublicationJob, getSocialProfiles, getStudioData, getStudioPost, linkInstagramProfileToConnection, recordHashtagGroupUsage, recordPublicationAttempt, removeHashtagGroup, removeSocialProfile, updateAutomationSettings, updateBrandProfile, updateHashtagGroup, updatePublicationJob, updateSocialProfile, updateStudioPost, addPostMedia, removePostMedia } from "../socialStudioDb";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { buildInstagramBusinessLoginUrl, isInstagramMetaConfigured, validateInstagramMetaCredentials } from "../instagramApi";
import { createInstagramOAuthState } from "../instagramOAuthState";
import { getInstagramRedirectUri } from "../instagramOrigins";
import { executeConfirmedInstagramPublication, testInstagramConnection, testInstagramPublication } from "../instagramPublicationService";
import { scheduleConfirmedInstagramPublication } from "../instagramSchedule";
import { parse as parseCookie } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import { generateImage } from "../_core/imageGeneration";
import { buildArtworkPrompt } from "../artworkDirection";
import { fetchCurrentRadar } from "../newsRadar";
import { publicSocialProfileHandle, publicSocialProfileUrl, socialNetworkInput } from "../socialProfilePolicy";
import { assertApprovalStillValid, assertPostMediaCanChange } from "../socialOsGovernance";
import { generateCampaignSafely } from "../socialOsCampaign";
import { AI_IMAGE_LIMIT, AI_TEXT_LIMIT, consumeRateLimit } from "../_core/rateLimit";
import { decodeValidatedBase64, detectKnowledgeFile as detectSecureKnowledgeFile } from "./knowledgeSecurity";

const statusSchema = z.enum(contentStatuses);
const formatSchema = z.enum(editorialFormats);
const hashtagGroupPayload = z.object({ name: z.string().trim().min(2).max(180), area: z.string().trim().min(2).max(120).nullable(), tags: z.string().trim().min(2).max(3_000), description: z.string().trim().max(2_000).nullable() });

export const socialStudioRouter = router({
  data: protectedProcedure.query(({ ctx }) => getStudioData(ctx.user.id)),
  hashtagGroups: protectedProcedure.query(({ ctx }) => getHashtagGroups(ctx.user.id)),
  addHashtagGroup: protectedProcedure.input(hashtagGroupPayload).mutation(({ ctx, input }) => createHashtagGroup(ctx.user.id, input)),
  updateHashtagGroup: protectedProcedure.input(hashtagGroupPayload.extend({ id: z.number().int().positive() })).mutation(({ ctx, input }) => {
    const { id, ...values } = input;
    return updateHashtagGroup(ctx.user.id, id, values);
  }),
  removeHashtagGroup: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => removeHashtagGroup(ctx.user.id, input.id)),
  useHashtagGroup: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => recordHashtagGroupUsage(ctx.user.id, input.id)),
  socialProfiles: protectedProcedure.query(({ ctx }) => getSocialProfiles(ctx.user.id)),
  addSocialProfile: protectedProcedure.input(z.object({
    network: socialNetworkInput,
    displayName: z.string().trim().min(2).max(160),
    handle: publicSocialProfileHandle,
    profileUrl: publicSocialProfileUrl,
    externalAccountId: z.string().trim().max(160).nullable(),
    notes: z.string().trim().max(2000).nullable(),
  })).mutation(({ ctx, input }) => createSocialProfile(ctx.user.id, {
    ...input,
    connectionMode: "manual",
    state: "active",
    verifiedAt: new Date(),
  })),
  updateSocialProfile: protectedProcedure.input(z.object({
    id: z.number(),
    displayName: z.string().trim().min(2).max(160),
    handle: publicSocialProfileHandle,
    profileUrl: publicSocialProfileUrl,
    externalAccountId: z.string().trim().max(160).nullable(),
    notes: z.string().trim().max(2000).nullable(),
    state: z.enum(["active", "inactive"]),
  })).mutation(({ ctx, input }) => {
    const { id, ...patch } = input;
    return updateSocialProfile(ctx.user.id, id, patch);
  }),
  removeSocialProfile: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) => removeSocialProfile(ctx.user.id, input.id)),
  radar: protectedProcedure.query(() => fetchCurrentRadar()),
  updateAutomation: protectedProcedure.input(z.object({
    enabled: z.boolean(),
    cadence: z.enum(["daily", "weekdays", "custom"]),
    postsPerWeek: z.number().int().min(1).max(7),
    defaultPublishTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    planningHorizonDays: z.number().int().min(7).max(90),
    requireApproval: z.boolean(),
    allowSelfApproval: z.boolean(),
    refreshRadarDaily: z.boolean(),
    preferredAreas: z.string().max(1000).nullable(),
    preferredFormats: z.string().max(500).nullable(),
  })).mutation(({ ctx, input }) => updateAutomationSettings(ctx.user.id, input)),
  createFromRadar: protectedProcedure.input(z.object({
    title: z.string().min(8).max(500),
    url: z.string().url(),
    source: z.string().min(2).max(180),
    summary: z.string().max(4000).nullable(),
    area: z.string().min(2).max(120),
  })).mutation(async ({ ctx, input }) => {
    consumeRateLimit(ctx.user.id, "socialStudio.createFromRadar", AI_TEXT_LIMIT);
    const [{ brand }, source] = await Promise.all([
      getStudioData(ctx.user.id),
      getOrCreateContentSource(ctx.user.id, { title: input.source, sourceType: "fonte oficial / radar", url: input.url, notes: input.summary }),
    ]);
    const generated = await generateLegalDraft({
      area: input.area,
      topic: input.title,
      audience: brand?.targetAudience ?? "Pessoas físicas e empresas",
      format: "post",
      objective: "Atualidade e autoridade técnica",
      legalSource: input.url,
      primaryCta: brand?.primaryCta,
      toneOfVoice: brand?.toneOfVoice,
      prohibitedTerms: brand?.prohibitedTerms,
    });
    return createStudioPost(ctx.user.id, {
      topicId: null, sourceId: source.id, area: input.area, format: "post",
      audience: brand?.targetAudience ?? "Pessoas físicas e empresas",
      strategicObjective: "Atualidade e autoridade técnica", contentPillar: "Atualidade jurídica",
      campaign: `Radar — ${input.source}`, funnelStage: "discovery", templateKey: "noticia_comentada",
      title: generated.title, hook: generated.hook, caption: generated.caption, cta: generated.cta, hashtags: generated.hashtags, altText: generated.altText,
      keyStatement: generated.hook, legalSource: input.url, reviewDueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), status: "draft",
    });
  }),
  generateCampaign: protectedProcedure.input(z.object({
    idempotencyKey: z.string().uuid(),
    days: z.union([z.literal(7), z.literal(15), z.literal(30)]),
    startDate: z.date(),
    postsPerWeek: z.number().int().min(1).max(7),
    defaultPublishTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    objective: z.string().min(2).max(180).default("Autoridade"),
    timezone: z.string().min(3).max(80).default("America/Sao_Paulo"),
  })).mutation(({ ctx, input }) => generateCampaignSafely(ctx.user.id, input)),
  generatePostArtwork: protectedProcedure.input(z.object({
    postId: z.number(),
    style: z.enum(["tech_premium", "editorial", "photographic", "minimal"]).default("tech_premium"),
    direction: z.string().max(1000).nullable().optional(),
  })).mutation(async ({ ctx, input }) => {
    consumeRateLimit(ctx.user.id, "socialStudio.generatePostArtwork", AI_IMAGE_LIMIT);
    const [post, { brand }] = await Promise.all([getStudioPost(ctx.user.id, input.postId), getStudioData(ctx.user.id)]);
    const prompt = buildArtworkPrompt({
      title: post.title,
      area: post.area,
      style: input.style,
      direction: input.direction,
      brand: brand ? { brandName: brand.brandName, segment: brand.segment, targetAudience: brand.targetAudience, visualGuidelines: brand.visualGuidelines } : null,
    });
    const generated = await generateImage({ prompt, quality: "high" });
    if (!generated.url) throw new Error("A geração visual não retornou uma imagem.");
    return { url: generated.url, style: input.style, postId: post.id };
  }),

  instagramData: protectedProcedure.query(async ({ ctx }) => {
    const [studio, instagram, metaCredentials] = await Promise.all([getStudioData(ctx.user.id), getInstagramStudioData(ctx.user.id), validateInstagramMetaCredentials()]);
    return { ...instagram, posts: studio.posts, media: studio.media, brand: studio.brand, metaConfigured: metaCredentials.validated, metaCredentialsConfigured: metaCredentials.configured, metaValidationCode: metaCredentials.code };
  }),
  beginInstagramConnection: protectedProcedure.input(z.object({ profileId: z.number().int().positive().optional() }).optional()).mutation(async ({ ctx, input }) => {
    if (!isInstagramMetaConfigured()) throw new Error("A aplicação Meta ainda não está acessível ou suas credenciais não foram configuradas no ambiente seguro.");
    const metaCredentials = await validateInstagramMetaCredentials();
    if (!metaCredentials.validated) throw new Error(`A validação técnica das credenciais Meta ainda não foi aprovada (${metaCredentials.code ?? "META_CREDENTIALS_REJECTED"}). Corrija o App ID e o App Secret no cofre seguro antes do OAuth.`);
    const profiles = await getSocialProfiles(ctx.user.id);
    const activeInstagramProfiles = profiles.filter(profile => profile.network === "instagram" && profile.state !== "inactive");
    const profileId = input?.profileId ?? (activeInstagramProfiles.length === 1 ? activeInstagramProfiles[0]?.id : undefined);
    if (!profileId) throw new Error("Cadastre ou selecione um único perfil ativo de Instagram antes de iniciar o OAuth oficial.");
    await linkInstagramProfileToConnection(ctx.user.id, profileId);
    const redirectUri = getInstagramRedirectUri(ctx.req);
    return { authorizationUrl: buildInstagramBusinessLoginUrl(redirectUri, createInstagramOAuthState(ctx.user.id)), redirectUri };
  }),
  testInstagramConnection: protectedProcedure.mutation(({ ctx }) => testInstagramConnection(ctx.user.id)),
  generateDraft: protectedProcedure.input(z.object({
    topicId: z.number().nullable(),
    sourceId: z.number().nullable(),
    area: z.string().min(2),
    topic: z.string().min(4),
    audience: z.string().min(2),
    format: formatSchema,
    objective: z.string().min(2),
    contentPillar: z.string().min(2),
    campaign: z.string().max(180).nullable(),
    funnelStage: z.enum(["discovery", "consideration", "conversion", "relationship"]),
    templateKey: z.string().max(60),
    legalSource: z.string().nullable(),
  })).mutation(async ({ ctx, input }) => {
    consumeRateLimit(ctx.user.id, "socialStudio.generateDraft", AI_TEXT_LIMIT);
    const { brand } = await getStudioData(ctx.user.id);
    const generated = await generateLegalDraft({
      ...input,
      primaryCta: brand?.primaryCta,
      toneOfVoice: brand?.toneOfVoice,
      prohibitedTerms: brand?.prohibitedTerms,
    });
    return createStudioPost(ctx.user.id, {
      topicId: input.topicId,
      sourceId: input.sourceId,
      area: input.area,
      audience: input.audience,
      format: input.format,
      strategicObjective: input.objective,
      contentPillar: input.contentPillar,
      campaign: input.campaign,
      funnelStage: input.funnelStage,
      templateKey: input.templateKey,
      title: generated.title,
      hook: generated.hook,
      caption: generated.caption,
      cta: generated.cta,
      hashtags: generated.hashtags,
      altText: generated.altText,
      keyStatement: generated.hook,
      legalSource: input.legalSource,
      reviewDueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "draft",
    });
  }),
  sendToReview: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const [post, { brand }] = await Promise.all([getStudioPost(ctx.user.id, input.id), getStudioData(ctx.user.id)]);
    const result = canSubmitForReview({ ...post, prohibitedTerms: brand?.prohibitedTerms });
    if (!result.allowed) throw new Error(result.reason);
    return updateStudioPost(ctx.user.id, post.id, { status: "review" });
  }),
  updateBrand: protectedProcedure.input(z.object({
    brandName: z.string().min(3), segment: z.string().min(3), location: z.string().nullable(),
    targetAudience: z.string().nullable(), commercialGoal: z.string().nullable(), toneOfVoice: z.string().nullable(),
    primaryCta: z.string().nullable(), prohibitedTerms: z.string().nullable(), websiteUrl: z.string().url().nullable(),
    whatsapp: z.string().nullable(), visualGuidelines: z.string().nullable(), operationMode: z.enum(["manual", "semi_automatic"]),
  })).mutation(({ ctx, input }) => updateBrandProfile(ctx.user.id, input)),
  addSource: protectedProcedure.input(z.object({
    title: z.string().min(3),
    sourceType: z.string().min(2),
    url: z.string().url().nullable(),
    notes: z.string().nullable(),
    verifiedAt: z.date().nullable(),
  })).mutation(({ ctx, input }) => createContentSource(ctx.user.id, input)),
  addKnowledge: protectedProcedure.input(z.object({
    title: z.string().min(3),
    materialType: z.string().min(2),
    url: z.string().url().nullable(),
    notes: z.string().nullable(),
    isVerified: z.boolean(),
  })).mutation(({ ctx, input }) => createKnowledgeMaterial(ctx.user.id, input)),
  uploadKnowledge: protectedProcedure.input(z.object({
    title: z.string().min(3).max(255),
    materialType: z.string().min(2).max(60),
    mimeType: z.string().min(3).max(120),
    base64: z.string().min(8).max(8_000_000),
    notes: z.string().nullable(),
    isVerified: z.boolean(),
  })).mutation(async ({ ctx, input }) => {
    const bytes = decodeValidatedBase64(input.base64);
    if (bytes.byteLength === 0 || bytes.byteLength > 5 * 1024 * 1024) throw new Error("O arquivo deve ter até 5 MB.");
    const detected = detectSecureKnowledgeFile(bytes);
    if (!detected) throw new Error("Formato não reconhecido. Envie PDF, DOC, DOCX, JPEG, PNG ou WEBP válidos.");
    const normalizedClaim = input.mimeType.toLocaleLowerCase("pt-BR");
    const acceptedClaims = detected.claims;
    if (!acceptedClaims.some(claim => normalizedClaim.includes(claim))) throw new Error("O tipo informado pelo navegador não corresponde ao conteúdo real do arquivo.");
    const safeName = input.title.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "material";
    const stored = await storagePut(`social-studio/${ctx.user.id}/conhecimento/${safeName}${detected.extension}`, bytes, detected.mimeType);
    return createKnowledgeMaterial(ctx.user.id, { title: input.title, materialType: input.materialType, url: stored.url, storageKey: stored.key, mimeType: detected.mimeType, notes: input.notes, isVerified: input.isVerified });
  }),
  getPostMedia: protectedProcedure.input(z.object({ postId: z.number() })).query(({ ctx, input }) => getPostMedia(ctx.user.id, input.postId)),
  uploadPostMedia: protectedProcedure.input(z.object({
    postId: z.number(),
    fileName: z.string().min(1).max(255),
    mimeType: z.literal("image/jpeg"),
    base64: z.string().min(8).max(11_500_000),
  })).mutation(async ({ ctx, input }) => {
    await assertPostMediaCanChange(ctx.user.id, input.postId);
    const bytes = decodeValidatedBase64(input.base64);
    if (bytes.byteLength === 0 || bytes.byteLength > 8 * 1024 * 1024) throw new Error("A imagem precisa ser JPEG e ter até 8 MB.");
    const dimensions = jpegDimensions(bytes);
    if (!dimensions) throw new Error("Não foi possível confirmar as dimensões do JPEG. Exporte a imagem novamente em JPEG sRGB.");
    const ratio = dimensions.width / dimensions.height;
    if (ratio < 4 / 5 || ratio > 1.91) throw new Error("A imagem precisa respeitar a proporção entre 4:5 e 1.91:1.");
    const safeName = input.fileName.toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "arte-instagram";
    const stored = await storagePut(`social-studio/${ctx.user.id}/posts/${input.postId}/${safeName}.jpg`, bytes, "image/jpeg");
    return addPostMedia(ctx.user.id, input.postId, { storageKey: stored.key, url: stored.url, fileName: input.fileName, mimeType: "image/jpeg", byteSize: bytes.byteLength, width: dimensions.width, height: dimensions.height });
  }),
  removePostMedia: protectedProcedure.input(z.object({ postId: z.number(), mediaId: z.number() })).mutation(async ({ ctx, input }) => {
    await assertPostMediaCanChange(ctx.user.id, input.postId);
    return removePostMedia(ctx.user.id, input.postId, input.mediaId);
  }),
  confirmInstagramPublication: protectedProcedure.input(z.object({ jobId: z.number(), confirmed: z.literal(true) })).mutation(async ({ ctx, input }) => {
    const current = await getPublicationJob(ctx.user.id, input.jobId);
    if (current.status !== "pending_confirmation") throw new Error("Esta solicitação não está disponível para uma nova confirmação.");
    await assertApprovalStillValid(ctx.user.id, current.postId);
    const job = await updatePublicationJob(current.id, { status: "queued", confirmedAt: new Date(), confirmedByUserId: ctx.user.id, lastError: null });
    await recordPublicationAttempt(job.id, { stage: "preflight", outcome: "succeeded", detail: `Confirmação humana registrada por ${ctx.user.name ?? "responsável"}.` });
    return job;
  }),
  testInstagramPublication: protectedProcedure.input(z.object({ jobId: z.number() })).mutation(({ ctx, input }) => testInstagramPublication(ctx.user.id, input.jobId)),
  scheduleInstagramPublication: protectedProcedure.input(z.object({ jobId: z.number(), scheduledAt: z.date(), confirmed: z.literal(true) })).mutation(async ({ ctx, input }) => {
    const current = await getPublicationJob(ctx.user.id, input.jobId);
    if (current.status !== "pending_confirmation") throw new Error("Esta solicitação não está disponível para confirmação e agendamento.");
    await assertApprovalStillValid(ctx.user.id, current.postId);
    const queued = await updatePublicationJob(current.id, { status: "queued", confirmedAt: new Date(), confirmedByUserId: ctx.user.id, lastError: null });
    const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
    try {
      return await scheduleConfirmedInstagramPublication(ctx.user.id, queued.id, input.scheduledAt, sessionToken);
    } catch (error) {
      await updatePublicationJob(queued.id, { status: "pending_confirmation", confirmedAt: null, confirmedByUserId: null });
      throw error;
    }
  }),
  publishInstagramNow: protectedProcedure.input(z.object({ jobId: z.number() })).mutation(({ ctx, input }) => executeConfirmedInstagramPublication(ctx.user.id, input.jobId)),
});

function jpegDimensions(bytes: Buffer) {
  if (bytes.length < 10 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset++];
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 1 >= bytes.length) return null;
    const length = bytes.readUInt16BE(offset);
    if (length < 7 || offset + length > bytes.length) return null;
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: bytes.readUInt16BE(offset + 3), width: bytes.readUInt16BE(offset + 5) };
    }
    offset += length;
  }
  return null;
}
