import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const opportunityStatuses = ["new", "selected", "dismissed", "converted"] as const;
export const interactionKinds = ["question", "praise", "complaint", "quote", "support", "opportunity", "spam", "legal_risk", "sensitive"] as const;
export const interactionStatuses = ["open", "triaged", "waiting_human", "resolved", "ignored"] as const;
export const leadStatuses = ["new", "qualified", "contacted", "won", "lost"] as const;
export const automationTriggerTypes = ["schedule", "opportunity_score", "interaction_kind", "metric_threshold"] as const;
export const automationActionTypes = ["create_draft", "request_approval", "suggest_reply", "create_lead", "create_report"] as const;

export const contentOpportunities = mysqlTable("content_opportunities", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), sourceUrl: varchar("sourceUrl", { length: 2048 }), sourceName: varchar("sourceName", { length: 180 }), title: varchar("title", { length: 500 }).notNull(), summary: text("summary"), area: varchar("area", { length: 120 }), locality: varchar("locality", { length: 180 }), relevanceScore: int("relevanceScore").default(0).notNull(), freshnessScore: int("freshnessScore").default(0).notNull(), authorityScore: int("authorityScore").default(0).notNull(), commercialScore: int("commercialScore").default(0).notNull(), riskScore: int("riskScore").default(0).notNull(), totalScore: int("totalScore").default(0).notNull(), rationale: text("rationale"), status: mysqlEnum("status", opportunityStatuses).default("new").notNull(), detectedAt: timestamp("detectedAt").defaultNow().notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("content_opportunities_user_score_idx").on(table.userId, table.totalScore), index("content_opportunities_user_status_idx").on(table.userId, table.status)]);

export const postVersions = mysqlTable("post_versions", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), postId: int("postId").notNull(), version: int("version").notNull(), contentHash: varchar("contentHash", { length: 64 }).notNull(), snapshotJson: text("snapshotJson").notNull(), changeReason: varchar("changeReason", { length: 255 }), createdByUserId: int("createdByUserId").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("post_versions_post_version_unique").on(table.postId, table.version), index("post_versions_user_post_idx").on(table.userId, table.postId)]);

export const postApprovalBindings = mysqlTable("post_approval_bindings", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), postId: int("postId").notNull(), versionId: int("versionId").notNull(), contentHash: varchar("contentHash", { length: 64 }).notNull(), approvedByUserId: int("approvedByUserId").notNull(), approvedAt: timestamp("approvedAt").defaultNow().notNull(), invalidatedAt: timestamp("invalidatedAt"), invalidationReason: varchar("invalidationReason", { length: 255 }),
}, table => [index("post_approval_bindings_post_idx").on(table.userId, table.postId)]);

export const campaignRuns = mysqlTable("campaign_runs", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), idempotencyKey: varchar("idempotencyKey", { length: 128 }).notNull(), name: varchar("name", { length: 180 }).notNull(), horizonDays: int("horizonDays").notNull(), postsPerWeek: int("postsPerWeek").notNull(), timezone: varchar("timezone", { length: 80 }).default("America/Sao_Paulo").notNull(), status: mysqlEnum("status", ["planning", "generated", "failed"]).default("planning").notNull(), generatedCount: int("generatedCount").default(0).notNull(), errorMessage: text("errorMessage"), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("campaign_runs_user_idempotency_unique").on(table.userId, table.idempotencyKey), index("campaign_runs_user_idx").on(table.userId, table.createdAt)]);

export const socialInteractions = mysqlTable("social_interactions", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), socialProfileId: int("socialProfileId"), network: varchar("network", { length: 40 }).notNull(), externalId: varchar("externalId", { length: 180 }), authorName: varchar("authorName", { length: 180 }), authorHandle: varchar("authorHandle", { length: 180 }), body: text("body").notNull(), kind: mysqlEnum("kind", interactionKinds).default("question").notNull(), status: mysqlEnum("status", interactionStatuses).default("open").notNull(), aiSuggestedReply: text("aiSuggestedReply"), requiresHumanApproval: boolean("requiresHumanApproval").default(false).notNull(), receivedAt: timestamp("receivedAt").defaultNow().notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("social_interactions_user_status_idx").on(table.userId, table.status), index("social_interactions_user_kind_idx").on(table.userId, table.kind)]);

export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), source: varchar("source", { length: 120 }).notNull(), sourceInteractionId: int("sourceInteractionId"), name: varchar("name", { length: 180 }), contact: varchar("contact", { length: 320 }), interest: varchar("interest", { length: 255 }), notes: text("notes"), status: mysqlEnum("status", leadStatuses).default("new").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("leads_user_status_idx").on(table.userId, table.status)]);

export const competitors = mysqlTable("competitors", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), name: varchar("name", { length: 180 }).notNull(), websiteUrl: varchar("websiteUrl", { length: 1024 }), instagramUrl: varchar("instagramUrl", { length: 1024 }), linkedinUrl: varchar("linkedinUrl", { length: 1024 }), notes: text("notes"), active: boolean("active").default(true).notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("competitors_user_idx").on(table.userId, table.active)]);

export const contentMetrics = mysqlTable("content_metrics", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), postId: int("postId").notNull(), network: varchar("network", { length: 40 }).notNull(), impressions: int("impressions").default(0).notNull(), reach: int("reach").default(0).notNull(), likes: int("likes").default(0).notNull(), comments: int("comments").default(0).notNull(), shares: int("shares").default(0).notNull(), saves: int("saves").default(0).notNull(), clicks: int("clicks").default(0).notNull(), leads: int("leads").default(0).notNull(), capturedAt: timestamp("capturedAt").defaultNow().notNull(),
}, table => [index("content_metrics_user_post_idx").on(table.userId, table.postId)]);

export const creativeEvaluations = mysqlTable("creative_evaluations", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), postId: int("postId").notNull(), mediaUrl: varchar("mediaUrl", { length: 2048 }).notNull(), visualQuality: int("visualQuality").default(0).notNull(), brandFit: int("brandFit").default(0).notNull(), legibility: int("legibility").default(0).notNull(), attentionPotential: int("attentionPotential").default(0).notNull(), aiAppearanceRisk: int("aiAppearanceRisk").default(0).notNull(), notes: text("notes"), passed: boolean("passed").default(false).notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("creative_evaluations_user_post_idx").on(table.userId, table.postId)]);

export const automationRules = mysqlTable("automation_rules", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), name: varchar("name", { length: 180 }).notNull(), enabled: boolean("enabled").default(false).notNull(), triggerType: mysqlEnum("triggerType", automationTriggerTypes).notNull(), triggerConfigJson: text("triggerConfigJson").notNull(), actionType: mysqlEnum("actionType", automationActionTypes).notNull(), actionConfigJson: text("actionConfigJson").notNull(), requiresHumanApproval: boolean("requiresHumanApproval").default(true).notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("automation_rules_user_idx").on(table.userId, table.enabled)]);

export const auditEvents = mysqlTable("audit_events", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), actorUserId: int("actorUserId"), entityType: varchar("entityType", { length: 80 }).notNull(), entityId: varchar("entityId", { length: 120 }), action: varchar("action", { length: 120 }).notNull(), detailJson: text("detailJson"), createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("audit_events_user_created_idx").on(table.userId, table.createdAt)]);
