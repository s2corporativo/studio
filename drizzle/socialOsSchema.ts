import {
  sqliteTable,
  integer,
  text,
  index,
  uniqueIndex,
  sql,
} from "drizzle-orm/sqlite-core";

export const opportunityStatuses = ["new", "selected", "dismissed", "converted"] as const;
export const interactionKinds = ["question", "praise", "complaint", "quote", "support", "opportunity", "spam", "legal_risk", "sensitive"] as const;
export const interactionStatuses = ["open", "triaged", "waiting_human", "resolved", "ignored"] as const;
export const leadStatuses = ["new", "qualified", "contacted", "won", "lost"] as const;
export const automationTriggerTypes = ["schedule", "opportunity_score", "interaction_kind", "metric_threshold"] as const;
export const automationActionTypes = ["create_draft", "request_approval", "suggest_reply", "create_lead", "create_report"] as const;

export const contentOpportunities = sqliteTable("content_opportunities", {
  id: integer("id").primaryKey({ autoIncrement: true }), userId: integer("userId").notNull(), sourceUrl: text("sourceUrl"), sourceName: text("sourceName"), title: text("title").notNull(), summary: text("summary"), area: text("area"), locality: text("locality"), relevanceScore: integer("relevanceScore").default(0).notNull(), freshnessScore: integer("freshnessScore").default(0).notNull(), authorityScore: integer("authorityScore").default(0).notNull(), commercialScore: integer("commercialScore").default(0).notNull(), riskScore: integer("riskScore").default(0).notNull(), totalScore: integer("totalScore").default(0).notNull(), rationale: text("rationale"), status: text("status").default("new").notNull(), detectedAt: integer("detectedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(), createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(), updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
}, table => [index("content_opportunities_user_score_idx").on(table.userId, table.totalScore), index("content_opportunities_user_status_idx").on(table.userId, table.status)]);

export const postVersions = sqliteTable("post_versions", {
  id: integer("id").primaryKey({ autoIncrement: true }), userId: integer("userId").notNull(), postId: integer("postId").notNull(), version: integer("version").notNull(), contentHash: text("contentHash").notNull(), snapshotJson: text("snapshotJson").notNull(), changeReason: text("changeReason"), createdByUserId: integer("createdByUserId").notNull(), createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
}, table => [uniqueIndex("post_versions_post_version_unique").on(table.postId, table.version), index("post_versions_user_post_idx").on(table.userId, table.postId)]);

export const postApprovalBindings = sqliteTable("post_approval_bindings", {
  id: integer("id").primaryKey({ autoIncrement: true }), userId: integer("userId").notNull(), postId: integer("postId").notNull(), versionId: integer("versionId").notNull(), contentHash: text("contentHash").notNull(), approvedByUserId: integer("approvedByUserId").notNull(), approvedAt: integer("approvedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(), invalidatedAt: integer("invalidatedAt", { mode: "timestamp" }), invalidationReason: text("invalidationReason"),
}, table => [index("post_approval_bindings_post_idx").on(table.userId, table.postId)]);

export const campaignRuns = sqliteTable("campaign_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }), userId: integer("userId").notNull(), idempotencyKey: text("idempotencyKey").notNull(), name: text("name").notNull(), horizonDays: integer("horizonDays").notNull(), postsPerWeek: integer("postsPerWeek").notNull(), timezone: text("timezone").default("America/Sao_Paulo").notNull(), status: text("status").default("planning").notNull(), generatedCount: integer("generatedCount").default(0).notNull(), errorMessage: text("errorMessage"), createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(), updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
}, table => [uniqueIndex("campaign_runs_user_idempotency_unique").on(table.userId, table.idempotencyKey), index("campaign_runs_user_idx").on(table.userId, table.createdAt)]);

export const socialInteractions = sqliteTable("social_interactions", {
  id: integer("id").primaryKey({ autoIncrement: true }), userId: integer("userId").notNull(), socialProfileId: integer("socialProfileId"), network: text("network").notNull(), externalId: text("externalId"), authorName: text("authorName"), authorHandle: text("authorHandle"), body: text("body").notNull(), kind: text("kind").default("question").notNull(), status: text("status").default("open").notNull(), aiSuggestedReply: text("aiSuggestedReply"), requiresHumanApproval: integer("requiresHumanApproval", { mode: "boolean" }).default(false).notNull(), receivedAt: integer("receivedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(), createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(), updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
}, table => [index("social_interactions_user_status_idx").on(table.userId, table.status), index("social_interactions_user_kind_idx").on(table.userId, table.kind)]);

export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }), userId: integer("userId").notNull(), source: text("source").notNull(), sourceInteractionId: integer("sourceInteractionId"), name: text("name"), contact: text("contact"), interest: text("interest"), notes: text("notes"), status: text("status").default("new").notNull(), createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(), updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
}, table => [index("leads_user_status_idx").on(table.userId, table.status)]);

export const competitors = sqliteTable("competitors", {
  id: integer("id").primaryKey({ autoIncrement: true }), userId: integer("userId").notNull(), name: text("name").notNull(), websiteUrl: text("websiteUrl"), instagramUrl: text("instagramUrl"), linkedinUrl: text("linkedinUrl"), notes: text("notes"), active: integer("active", { mode: "boolean" }).default(true).notNull(), createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(), updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
}, table => [index("competitors_user_idx").on(table.userId, table.active)]);

export const contentMetrics = sqliteTable("content_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }), userId: integer("userId").notNull(), postId: integer("postId").notNull(), network: text("network").notNull(), impressions: integer("impressions").default(0).notNull(), reach: integer("reach").default(0).notNull(), likes: integer("likes").default(0).notNull(), comments: integer("comments").default(0).notNull(), shares: integer("shares").default(0).notNull(), saves: integer("saves").default(0).notNull(), clicks: integer("clicks").default(0).notNull(), leads: integer("leads").default(0).notNull(), capturedAt: integer("capturedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
}, table => [index("content_metrics_user_post_idx").on(table.userId, table.postId)]);

export const creativeEvaluations = sqliteTable("creative_evaluations", {
  id: integer("id").primaryKey({ autoIncrement: true }), userId: integer("userId").notNull(), postId: integer("postId").notNull(), mediaUrl: text("mediaUrl").notNull(), visualQuality: integer("visualQuality").default(0).notNull(), brandFit: integer("brandFit").default(0).notNull(), legibility: integer("legibility").default(0).notNull(), attentionPotential: integer("attentionPotential").default(0).notNull(), aiAppearanceRisk: integer("aiAppearanceRisk").default(0).notNull(), notes: text("notes"), passed: integer("passed", { mode: "boolean" }).default(false).notNull(), createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
}, table => [index("creative_evaluations_user_post_idx").on(table.userId, table.postId)]);

export const automationRules = sqliteTable("automation_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }), userId: integer("userId").notNull(), name: text("name").notNull(), enabled: integer("enabled", { mode: "boolean" }).default(false).notNull(), triggerType: text("triggerType").notNull(), triggerConfigJson: text("triggerConfigJson").notNull(), actionType: text("actionType").notNull(), actionConfigJson: text("actionConfigJson").notNull(), requiresHumanApproval: integer("requiresHumanApproval", { mode: "boolean" }).default(true).notNull(), createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(), updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
}, table => [index("automation_rules_user_idx").on(table.userId, table.enabled)]);

export const auditEvents = sqliteTable("audit_events", {
  id: integer("id").primaryKey({ autoIncrement: true }), userId: integer("userId").notNull(), actorUserId: integer("actorUserId"), entityType: text("entityType").notNull(), entityId: text("entityId"), action: text("action").notNull(), detailJson: text("detailJson"), createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
}, table => [index("audit_events_user_created_idx").on(table.userId, table.createdAt)]);
