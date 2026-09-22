import {
  sqliteTable,
  integer,
  text,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const brandWorkspaceStatuses = ["active", "archived"] as const;
export const performanceLearningDimensions = ["topic", "format", "schedule", "cta", "audience", "channel", "visual_family", "humanization"] as const;

export const brandWorkspaces = sqliteTable("brand_workspaces", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  key: text("key").notNull(),
  name: text("name").notNull(),
  segment: text("segment"),
  location: text("location"),
  targetAudience: text("targetAudience"),
  commercialGoal: text("commercialGoal"),
  toneOfVoice: text("toneOfVoice"),
  primaryCta: text("primaryCta"),
  prohibitedTerms: text("prohibitedTerms"),
  visualGuidelines: text("visualGuidelines"),
  websiteUrl: text("websiteUrl"),
  whatsapp: text("whatsapp"),
  status: text("status").default("active").notNull(),
  isDefault: integer("isDefault", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
}, table => [
  uniqueIndex("brand_workspaces_user_key_unique").on(table.userId, table.key),
  index("brand_workspaces_user_default_idx").on(table.userId, table.isDefault),
  index("brand_workspaces_user_status_idx").on(table.userId, table.status),
]);

export const brandContentBindings = sqliteTable("brand_content_bindings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  brandWorkspaceId: integer("brandWorkspaceId").notNull(),
  postId: integer("postId").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
}, table => [
  uniqueIndex("brand_content_bindings_user_post_unique").on(table.userId, table.postId),
  index("brand_content_bindings_workspace_idx").on(table.userId, table.brandWorkspaceId),
]);

export const brandMemorySnapshots = sqliteTable("brand_memory_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  brandWorkspaceId: integer("brandWorkspaceId").notNull(),
  version: integer("version").notNull(),
  contentHash: text("contentHash").notNull(),
  memoryJson: text("memoryJson").notNull(),
  source: text("source").default("system").notNull(),
  active: integer("active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
}, table => [
  uniqueIndex("brand_memory_workspace_version_unique").on(table.brandWorkspaceId, table.version),
  index("brand_memory_user_workspace_active_idx").on(table.userId, table.brandWorkspaceId, table.active),
]);

export const performanceLearnings = sqliteTable("performance_learnings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  brandWorkspaceId: integer("brandWorkspaceId").notNull(),
  dimension: text("dimension").notNull(),
  key: text("key").notNull(),
  sampleSize: integer("sampleSize").default(0).notNull(),
  evidenceJson: text("evidenceJson").notNull(),
  recommendation: text("recommendation").notNull(),
  confidenceScore: integer("confidenceScore").default(0).notNull(),
  active: integer("active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
}, table => [
  uniqueIndex("performance_learnings_workspace_dimension_key_unique").on(table.brandWorkspaceId, table.dimension, table.key),
  index("performance_learnings_user_workspace_active_idx").on(table.userId, table.brandWorkspaceId, table.active),
]);
