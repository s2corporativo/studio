import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { generateImage } from "../_core/imageGeneration";
import { AI_IMAGE_LIMIT, consumeRateLimit } from "../_core/rateLimit";
import { buildArtworkPrompt } from "../artworkDirection";
import { getPostBrandWorkspace, listWorkspacePostIds } from "../brandWorkspaceDb";
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
    const [post, studio, workspace] = await Promise.all([
      getStudioPost(ctx.user.id, input.postId),
      getStudioData(ctx.user.id),
      getPostBrandWorkspace(ctx.user.id, input.postId),
    ]);
    const workspacePostIds = workspace ? new Set(await listWorkspacePostIds(ctx.user.id, workspace.id)) : null;
    const tone = workspace?.toneOfVoice ?? studio.brand?.toneOfVoice;
    const recentFingerprints = studio.posts
      .filter(item => item.id !== post.id && (!workspacePostIds || workspacePostIds.has(item.id)))
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
        tone,
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
    const brand = workspace
      ? {
          brandName: workspace.name,
          segment: workspace.segment,
          targetAudience: workspace.targetAudience,
          visualGuidelines: workspace.visualGuidelines,
        }
      : studio.brand
        ? {
            brandName: studio.brand.brandName,
            segment: studio.brand.segment,
            targetAudience: studio.brand.targetAudience,
            visualGuidelines: studio.brand.visualGuidelines,
          }
        : null;
    const prompt = buildArtworkPrompt({
      title: post.title,
      area: post.area,
      style: input.style,
      direction: [creativeDirectionToPrompt(creativeDirection), input.direction].filter(Boolean).join(" "),
      brand,
    });
    const generated = await generateImage({ prompt, quality: "high" });
    if (!generated.url) throw new Error("A geração visual não retornou uma imagem.");
    return {
      url: generated.url,
      style: input.style,
      postId: post.id,
      brandWorkspaceId: workspace?.id ?? null,
      creativeDirection,
      repetitionScoreBeforeGeneration: creativeDirection.repetitionScoreBeforeGeneration,
    };
  }),
});
