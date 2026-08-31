import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const brandWorkspaceStatuses = ["active", "archived"] as const;
export const performanceLearningDimensions = ["topic", "format", "schedule", "cta", "audience", "channel", "visual_family", "humanization"] as const;

export const brandWorkspaces = mysqlTable("brand_workspaces", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  key: varchar("key", { length: 120 }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  segment: varchar("segment", { length: 180 }),
  location: varchar("location", { length: 180 }),
  targetAudience: text("targetAudience"),
  commercialGoal: text("commercialGoal"),
  toneOfVoice: text("toneOfVoice"),
  primaryCta: text("primaryCta"),
  prohibitedTerms: text("prohibitedTerms"),
  visualGuidelines: text("visualGuidelines"),
  websiteUrl: varchar("websiteUrl", { length: 1024 }),
  whatsapp: varchar("whatsapp", { length: 80 }),
  status: mysqlEnum("status", brandWorkspaceStatuses).default("active").notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("brand_workspaces_user_key_unique").on(table.userId, table.key),
  index("brand_workspaces_user_default_idx").on(table.userId, table.isDefault),
  index("brand_workspaces_user_status_idx").on(table.userId, table.status),
]);

export const brandContentBindings = mysqlTable("brand_content_bindings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  brandWorkspaceId: int("brandWorkspaceId").notNull(),
  postId: int("postId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("brand_content_bindings_user_post_unique").on(table.userId, table.postId),
  index("brand_content_bindings_workspace_idx").on(table.userId, table.brandWorkspaceId),
]);

export const brandMemorySnapshots = mysqlTable("brand_memory_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  brandWorkspaceId: int("brandWorkspaceId").notNull(),
  version: int("version").notNull(),
  contentHash: varchar("contentHash", { length: 64 }).notNull(),
  memoryJson: text("memoryJson").notNull(),
  source: varchar("source", { length: 120 }).default("system").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("brand_memory_workspace_version_unique").on(table.brandWorkspaceId, table.version),
  index("brand_memory_user_workspace_active_idx").on(table.userId, table.brandWorkspaceId, table.active),
]);

export const performanceLearnings = mysqlTable("performance_learnings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  brandWorkspaceId: int("brandWorkspaceId").notNull(),
  dimension: mysqlEnum("dimension", performanceLearningDimensions).notNull(),
  key: varchar("key", { length: 180 }).notNull(),
  sampleSize: int("sampleSize").default(0).notNull(),
  evidenceJson: text("evidenceJson").notNull(),
  recommendation: text("recommendation").notNull(),
  confidenceScore: int("confidenceScore").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("performance_learnings_workspace_dimension_key_unique").on(table.brandWorkspaceId, table.dimension, table.key),
  index("performance_learnings_user_workspace_active_idx").on(table.userId, table.brandWorkspaceId, table.active),
]);
