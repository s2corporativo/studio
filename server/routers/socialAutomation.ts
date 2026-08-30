import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  approveAutomationExecution,
  executeAutomationExecution,
  getAutonomyProfile,
  listAutomationExecutions,
  scanAutomationRules,
  updateAutonomyProfile,
} from "../socialAutomationEngine";
import { recordAuditEvent } from "../socialOsDb";

export const socialAutomationRouter = router({
  profile: protectedProcedure.query(({ ctx }) => getAutonomyProfile(ctx.user.id)),

  executions: protectedProcedure.query(({ ctx }) => listAutomationExecutions(ctx.user.id)),

  updateProfile: protectedProcedure.input(z.object({
    level: z.enum(["manual", "assisted", "semi_automatic", "autopilot"]),
    allowAutoResearch: z.boolean(),
    allowAutoDraft: z.boolean(),
    allowAutoSchedule: z.boolean(),
  })).mutation(async ({ ctx, input }) => {
    const profile = await updateAutonomyProfile(ctx.user.id, input);
    await recordAuditEvent(ctx.user.id, "autonomy.profile_updated", "autonomy_profile", profile?.id, {
      level: profile?.level,
      allowAutoResearch: profile?.allowAutoResearch,
      allowAutoDraft: profile?.allowAutoDraft,
      allowAutoSchedule: profile?.allowAutoSchedule,
      requireHumanForLegalContent: true,
      requireHumanForExternalPublish: true,
    });
    return profile;
  }),

  scan: protectedProcedure.mutation(({ ctx }) => scanAutomationRules(ctx.user.id)),

  approveExecution: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const result = await approveAutomationExecution(ctx.user.id, input.id);
    await recordAuditEvent(ctx.user.id, "automation.execution_approved", "automation_execution", input.id);
    return result;
  }),

  executeQueued: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => executeAutomationExecution(ctx.user.id, input.id)),
});
