import {
  sqliteTable,
  integer,
  text,
  index,
  uniqueIndex,
  sql,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role").default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const contentStatuses = [
  "draft",
  "review",
  "approved",
  "scheduled",
  "published",
  "rejected",
] as const;

export const editorialFormats = ["post", "carousel", "reel", "story"] as const;

export const instagramConnectionStates = ["disconnected", "pending", "connected", "expired", "error"] as const;
export const publicationJobStatuses = ["pending_confirmation", "queued", "processing", "published", "failed", "cancelled"] as const;
export const publicationAttemptStages = ["preflight", "container", "publish", "schedule", "callback"] as const;
export const publicationAttemptOutcomes = ["started", "succeeded", "failed", "skipped"] as const;
export const socialNetworks = ["instagram", "facebook", "linkedin", "tiktok", "youtube"] as const;
export const socialProfileStates = ["active", "inactive", "pending_oauth", "connected", "error"] as const;
export const socialProfileConnectionModes = ["manual", "oauth"] as const;

export const brandProfiles = sqliteTable("brand_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  brandName: text("brandName").notNull(),
  segment: text("segment").notNull(),
  location: text("location"),
  targetAudience: text("targetAudience"),
  commercialGoal: text("commercialGoal"),
  toneOfVoice: text("toneOfVoice"),
  primaryCta: text("primaryCta"),
  prohibitedTerms: text("prohibitedTerms"),
  operationMode: text("operationMode").default("manual").notNull(),
  websiteUrl: text("websiteUrl"),
  whatsapp: text("whatsapp"),
  visualGuidelines: text("visualGuidelines"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
}, table => [
  uniqueIndex("brand_profiles_user_unique").on(table.userId),
]);

export const automationCadences = ["daily", "weekdays", "custom"] as const;

export const automationSettings = sqliteTable("automation_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).default(false).notNull(),
  cadence: text("cadence").default("weekdays").notNull(),
  postsPerWeek: integer("postsPerWeek").default(5).notNull(),
  defaultPublishTime: text("defaultPublishTime").default("18:30").notNull(),
  planningHorizonDays: integer("planningHorizonDays").default(30).notNull(),
  requireApproval: integer("requireApproval", { mode: "boolean" }).default(true).notNull(),
  allowSelfApproval: integer("allowSelfApproval", { mode: "boolean" }).default(true).notNull(),
  refreshRadarDaily: integer("refreshRadarDaily", { mode: "boolean" }).default(true).notNull(),
  preferredAreas: text("preferredAreas"),
  preferredFormats: text("preferredFormats"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
}, table => [
  uniqueIndex("automation_settings_user_unique").on(table.userId),
]);

export const contentSources = sqliteTable("content_sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  title: text("title").notNull(),
  sourceType: text("sourceType").notNull(),
  url: text("url"),
  notes: text("notes"),
  verifiedAt: integer("verifiedAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const knowledgeMaterials = sqliteTable("knowledge_materials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  title: text("title").notNull(),
  materialType: text("materialType").notNull(),
  url: text("url"),
  storageKey: text("storageKey"),
  mimeType: text("mimeType"),
  notes: text("notes"),
  isVerified: integer("isVerified", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const editorialTopics = sqliteTable("editorial_topics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  area: text("area").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  audience: text("audience").notNull(),
  priority: text("priority").notNull(),
  suggestedFormat: text("suggestedFormat").notNull(),
  sourceUrl: text("sourceUrl"),
  tags: text("tags"),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const hashtagGroups = sqliteTable("hashtag_groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  name: text("name").notNull(),
  area: text("area"),
  tags: text("tags").notNull(),
  description: text("description"),
  usageCount: integer("usageCount").default(0).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
}, table => [
  index("hashtag_groups_user_idx").on(table.userId),
]);

export const contentPosts = sqliteTable("content_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  topicId: integer("topicId"),
  sourceId: integer("sourceId"),
  area: text("area").notNull(),
  format: text("format").notNull(),
  audience: text("audience").notNull(),
  strategicObjective: text("strategicObjective"),
  contentPillar: text("contentPillar"),
  campaign: text("campaign"),
  funnelStage: text("funnelStage"),
  templateKey: text("templateKey"),
  title: text("title").notNull(),
  hook: text("hook"),
  caption: text("caption"),
  cta: text("cta"),
  hashtags: text("hashtags"),
  altText: text("altText"),
  keyStatement: text("keyStatement"),
  legalSource: text("legalSource"),
  reviewDueAt: integer("reviewDueAt", { mode: "timestamp" }),
  mediaUrl: text("mediaUrl"),
  status: text("status").default("draft").notNull(),
  approvalOwnerId: integer("approvalOwnerId"),
  approvalOwnerName: text("approvalOwnerName"),
  approvalNotes: text("approvalNotes"),
  scheduledAt: integer("scheduledAt", { mode: "timestamp" }),
  publishedAt: integer("publishedAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
});

export const contentMedia = sqliteTable("content_media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  postId: integer("postId").notNull(),
  storageKey: text("storageKey"),
  url: text("url").notNull(),
  fileName: text("fileName"),
  mimeType: text("mimeType"),
  byteSize: integer("byteSize"),
  width: integer("width"),
  height: integer("height"),
  sortOrder: integer("sortOrder").default(0).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
}, table => [
  index("content_media_post_order_idx").on(table.postId, table.sortOrder),
  index("content_media_user_idx").on(table.userId),
]);

export const assetLibraryItems = sqliteTable("asset_library_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  sourcePath: text("sourcePath").notNull(),
  storageKey: text("storageKey").notNull(),
  url: text("url").notNull(),
  fileName: text("fileName").notNull(),
  area: text("area").notNull(),
  title: text("title").notNull(),
  assetType: text("assetType").notNull(),
  groupKey: text("groupKey"),
  slideOrder: integer("slideOrder"),
  mimeType: text("mimeType").notNull(),
  byteSize: integer("byteSize").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  tags: text("tags"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
}, table => [
  uniqueIndex("asset_library_source_unique").on(table.userId, table.sourcePath),
  index("asset_library_user_area_idx").on(table.userId, table.area),
  index("asset_library_group_order_idx").on(table.userId, table.groupKey, table.slideOrder),
]);

export const approvalLogs = sqliteTable("approval_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("postId").notNull(),
  reviewerId: integer("reviewerId").notNull(),
  reviewerName: text("reviewerName"),
  decision: text("decision").notNull(),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const instagramConnections = sqliteTable("instagram_connections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  socialProfileId: integer("socialProfileId"),
  instagramUserId: text("instagramUserId"),
  username: text("username"),
  accessTokenCiphertext: text("accessTokenCiphertext"),
  tokenExpiresAt: integer("tokenExpiresAt", { mode: "timestamp" }),
  permissions: text("permissions"),
  state: text("state").default("disconnected").notNull(),
  lastError: text("lastError"),
  connectedAt: integer("connectedAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
}, table => [
  uniqueIndex("instagram_connections_user_unique").on(table.userId),
  index("instagram_connections_profile_idx").on(table.socialProfileId),
  index("instagram_connections_state_idx").on(table.state),
]);

export const socialProfiles = sqliteTable("social_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  network: text("network").notNull(),
  displayName: text("displayName").notNull(),
  handle: text("handle"),
  profileUrl: text("profileUrl").notNull(),
  externalAccountId: text("externalAccountId"),
  connectionMode: text("connectionMode").default("manual").notNull(),
  state: text("state").default("active").notNull(),
  notes: text("notes"),
  verifiedAt: integer("verifiedAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
}, table => [
  uniqueIndex("social_profiles_user_network_url_unique").on(table.userId, table.network, table.profileUrl),
  index("social_profiles_user_network_idx").on(table.userId, table.network),
  index("social_profiles_user_state_idx").on(table.userId, table.state),
]);

export const publicationJobs = sqliteTable("publication_jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  postId: integer("postId").notNull(),
  connectionId: integer("connectionId"),
  status: text("status").default("pending_confirmation").notNull(),
  idempotencyKey: text("idempotencyKey").notNull(),
  frozenPayload: text("frozenPayload").notNull(),
  confirmedAt: integer("confirmedAt", { mode: "timestamp" }),
  confirmedByUserId: integer("confirmedByUserId"),
  scheduledAt: integer("scheduledAt", { mode: "timestamp" }),
  scheduleCronTaskUid: text("scheduleCronTaskUid"),
  testContainerId: text("testContainerId"),
  testedAt: integer("testedAt", { mode: "timestamp" }),
  containerId: text("containerId"),
  mediaId: text("mediaId"),
  permalink: text("permalink"),
  attemptCount: integer("attemptCount").default(0).notNull(),
  lastError: text("lastError"),
  publishedAt: integer("publishedAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
}, table => [
  uniqueIndex("publication_jobs_idempotency_unique").on(table.idempotencyKey),
  index("publication_jobs_user_status_idx").on(table.userId, table.status),
  index("publication_jobs_post_idx").on(table.postId),
  index("publication_jobs_cron_task_idx").on(table.scheduleCronTaskUid),
]);

export const publicationAttempts = sqliteTable("publication_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: integer("jobId").notNull(),
  stage: text("stage").notNull(),
  outcome: text("outcome").notNull(),
  externalReference: text("externalReference"),
  errorCode: text("errorCode"),
  detail: text("detail"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
}, table => [
  index("publication_attempts_job_idx").on(table.jobId, table.createdAt),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ContentPost = typeof contentPosts.$inferSelect;
export type EditorialTopic = typeof editorialTopics.$inferSelect;
export type BrandProfile = typeof brandProfiles.$inferSelect;
export type ContentStatus = (typeof contentStatuses)[number];
export type ContentMedia = typeof contentMedia.$inferSelect;
export type AssetLibraryItem = typeof assetLibraryItems.$inferSelect;
export type InstagramConnection = typeof instagramConnections.$inferSelect;
export type SocialProfile = typeof socialProfiles.$inferSelect;
export type PublicationJob = typeof publicationJobs.$inferSelect;
export type AutomationSetting = typeof automationSettings.$inferSelect;
export type HashtagGroup = typeof hashtagGroups.$inferSelect;
