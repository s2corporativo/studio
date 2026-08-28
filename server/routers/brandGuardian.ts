import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { evaluatePostCreative } from "../brandGuardian";

export const brandGuardianRouter = router({
  evaluate: protectedProcedure.input(z.object({
    postId: z.number().int().positive(),
    mediaId: z.number().int().positive().nullable().default(null),
  })).mutation(({ ctx, input }) => evaluatePostCreative(ctx.user.id, input.postId, input.mediaId)),
});
