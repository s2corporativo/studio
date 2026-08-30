import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { generateImage } from "../_core/imageGeneration";
import { AI_IMAGE_LIMIT, consumeRateLimit } from "../_core/rateLimit";
import { buildArtworkPrompt } from "../artworkDirection";
import { creativeDirectionToPrompt, generateCreativeDirection } from "../creativeDirector";
import { getStudioData, getStudioPost } from "../socialStudioDb";
import { buildContentFingerprint } from "../../shared/contentFingerprint";
import { compositionDirectiveFor } from "../../shared/visualRepetition";

const artworkStyle = z.enum(["tech_premium", "editorial", "photographic", "minimal"]);

export const creativeDirectorRouter = router({
  generateArtwork: protectedProcedure.input(z.object({
    postId: z.number().int().positive(),
    style: artworkStyle.default("editorial"),
    direction: z.string().max(1000).nullable().optional(),
  })).mutation(async ({ ctx, input }) => {
    consumeRateLimit(ctx.user.id, "creativeDirector.generateArtwork", AI_IMAGE_LIMIT);
    const [post, studio] = await Promise.all([
      getStudioPost(ctx.user.id, input.postId),
      getStudioData(ctx.user.id),
    ]);
    const recentFingerprints = studio.posts
      .filter(item => item.id !== post.id)
      .slice(0, 12)
      .map(item => buildContentFingerprint({
        title: item.title,
        hook: item.hook,
        caption: item.caption,
        area: item.area,
        audience: item.audience,
        objective: item.strategicObjective,
        pillar: item.contentPillar,
        campaign: item.campaign,
        funnelStage: item.funnelStage,
        format: item.format,
        visualFamily: compositionDirectiveFor(`${item.area}:${item.title}`).key,
        cta: item.cta,
        tone: studio.brand?.toneOfVoice,
      }));

    const creativeDirection = await generateCreativeDirection({
      title: post.title,
      area: post.area,
      audience: post.audience,
      objective: post.strategicObjective,
      format: post.format,
      userDirection: input.direction,
      recentFingerprints,
    });
    const prompt = buildArtworkPrompt({
      title: post.title,
      area: post.area,
      style: input.style,
      direction: [creativeDirectionToPrompt(creativeDirection), input.direction].filter(Boolean).join(" "),
      brand: studio.brand ? {
        brandName: studio.brand.brandName,
        segment: studio.brand.segment,
        targetAudience: studio.brand.targetAudience,
        visualGuidelines: studio.brand.visualGuidelines,
      } : null,
    });
    const generated = await generateImage({ prompt, quality: "high" });
    if (!generated.url) throw new Error("A geração visual não retornou uma imagem.");
    return {
      url: generated.url,
      style: input.style,
      postId: post.id,
      creativeDirection,
      repetitionScoreBeforeGeneration: creativeDirection.repetitionScoreBeforeGeneration,
    };
  }),
});
