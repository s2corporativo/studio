import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { archiveBrandWorkspace, bindPostToBrandWorkspace, createBrandWorkspace, getBrandWorkspace, listBrandWorkspaces, listPerformanceLearnings, setDefaultBrandWorkspace, updateBrandWorkspace } from "../brandWorkspaceDb";
import { learnBrandPerformance } from "../performanceLearningEngine";
import { recordAuditEvent } from "../socialOsDb";

const nullableText = (max: number) => z.string().trim().max(max).nullable();
const workspacePayload = z.object({
  name: z.string().trim().min(2).max(180),
  segment: nullableText(180),
  location: nullableText(180),
  targetAudience: nullableText(6000),
  commercialGoal: nullableText(6000),
  toneOfVoice: nullableText(6000),
  primaryCta: nullableText(3000),
  prohibitedTerms: nullableText(6000),
  visualGuidelines: nullableText(10_000),
  websiteUrl: z.string().url().max(1024).nullable(),
  whatsapp: nullableText(80),
});

export const brandWorkspacesRouter = router({
  list: protectedProcedure.query(({ ctx }) => listBrandWorkspaces(ctx.user.id)),

  get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ ctx, input }) => getBrandWorkspace(ctx.user.id, input.id)),

  create: protectedProcedure.input(workspacePayload.extend({ key: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) })).mutation(async ({ ctx, input }) => {
    const workspace = await createBrandWorkspace(ctx.user.id, input);
    await recordAuditEvent(ctx.user.id, "brand_workspace.created", "brand_workspace", workspace.id, { key: workspace.key, isDefault: workspace.isDefault });
    return workspace;
  }),

  update: protectedProcedure.input(workspacePayload.extend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { id, ...patch } = input;
    const workspace = await updateBrandWorkspace(ctx.user.id, id, patch);
    await recordAuditEvent(ctx.user.id, "brand_workspace.updated", "brand_workspace", id, { key: workspace.key });
    return workspace;
  }),

  setDefault: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const workspace = await setDefaultBrandWorkspace(ctx.user.id, input.id);
    await recordAuditEvent(ctx.user.id, "brand_workspace.default_changed", "brand_workspace", input.id, { key: workspace.key });
    return workspace;
  }),

  archive: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const workspace = await archiveBrandWorkspace(ctx.user.id, input.id);
    await recordAuditEvent(ctx.user.id, "brand_workspace.archived", "brand_workspace", input.id, { key: workspace.key });
    return workspace;
  }),

  bindPost: protectedProcedure.input(z.object({ brandWorkspaceId: z.number().int().positive(), postId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const binding = await bindPostToBrandWorkspace(ctx.user.id, input.brandWorkspaceId, input.postId);
    await recordAuditEvent(ctx.user.id, "brand_workspace.post_bound", "content_post", input.postId, { brandWorkspaceId: input.brandWorkspaceId });
    return binding;
  }),

  learnings: protectedProcedure.input(z.object({ brandWorkspaceId: z.number().int().positive() })).query(({ ctx, input }) => listPerformanceLearnings(ctx.user.id, input.brandWorkspaceId)),

  learnPerformance: protectedProcedure.input(z.object({ brandWorkspaceId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const result = await learnBrandPerformance(ctx.user.id, input.brandWorkspaceId);
    await recordAuditEvent(ctx.user.id, "brand_workspace.performance_learned", "brand_workspace", input.brandWorkspaceId, { samples: result.samples, learnings: result.learnings.length, snapshot: result.snapshot });
    return result;
  }),
});
