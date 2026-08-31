import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { evaluatePostCreative } from "../brandGuardian";
import { AI_TEXT_LIMIT, consumeRateLimit } from "../_core/rateLimit";

export const brandGuardianRouter = router({
  evaluate: protectedProcedure.input(z.object({
    postId: z.number().int().positive(),
    mediaId: z.number().int().positive().nullable().default(null),
  })).mutation(({ ctx, input }) => {
    consumeRateLimit(ctx.user.id, "brandGuardian.evaluate", AI_TEXT_LIMIT);
    return evaluatePostCreative(ctx.user.id, input.postId, input.mediaId);
  }),
});
