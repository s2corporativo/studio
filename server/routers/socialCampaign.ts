import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { generateCampaignSafely } from "../socialOsCampaign";
import { recordAuditEvent } from "../socialOsDb";
import { AI_TEXT_LIMIT, consumeRateLimit } from "../_core/rateLimit";

export const socialCampaignRouter = router({
  generate: protectedProcedure.input(z.object({
    idempotencyKey: z.string().uuid(),
    days: z.union([z.literal(7), z.literal(15), z.literal(30)]),
    startDate: z.date(),
    postsPerWeek: z.number().int().min(1).max(7),
    defaultPublishTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    objective: z.string().min(2).max(180).default("Autoridade"),
    timezone: z.string().min(3).max(80).default("America/Sao_Paulo"),
  })).mutation(async ({ ctx, input }) => {
    consumeRateLimit(ctx.user.id, "socialCampaign.generate", AI_TEXT_LIMIT);
    const result = await generateCampaignSafely(ctx.user.id, input);
    await recordAuditEvent(ctx.user.id, "campaign.generated", "campaign_run", result.campaignRunId, { count: result.count, timezone: result.timezone, reused: result.reused });
    return result;
  }),
});
