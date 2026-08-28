import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
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

export const brandProfiles = mysqlTable("brand_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  brandName: varchar("brandName", { length: 180 }).notNull(),
  segment: varchar("segment", { length: 180 }).notNull(),
  location: varchar("location", { length: 180 }),
  targetAudience: text("targetAudience"),
  commercialGoal: text("commercialGoal"),
  toneOfVoice: text("toneOfVoice"),
  primaryCta: text("primaryCta"),
  prohibitedTerms: text("prohibitedTerms"),
  operationMode: mysqlEnum("operationMode", ["manual", "semi_automatic"]).default("manual").notNull(),
  websiteUrl: varchar("websiteUrl", { length: 1024 }),
  whatsapp: varchar("whatsapp", { length: 80 }),
  visualGuidelines: text("visualGuidelines"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("brand_profiles_user_unique").on(table.userId),
]);

export const automationCadences = ["daily", "weekdays", "custom"] as const;

export const automationSettings = mysqlTable("automation_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  enabled: boolean("enabled").default(false).notNull(),
  cadence: mysqlEnum("cadence", automationCadences).default("weekdays").notNull(),
  postsPerWeek: int("postsPerWeek").default(5).notNull(),
  defaultPublishTime: varchar("defaultPublishTime", { length: 5 }).default("18:30").notNull(),
  planningHorizonDays: int("planningHorizonDays").default(30).notNull(),
  requireApproval: boolean("requireApproval").default(true).notNull(),
  refreshRadarDaily: boolean("refreshRadarDaily").default(true).notNull(),
  preferredAreas: text("preferredAreas"),
  preferredFormats: text("preferredFormats"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("automation_settings_user_unique").on(table.userId),
]);

export const contentSources = mysqlTable("content_sources", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  sourceType: varchar("sourceType", { length: 40 }).notNull(),
  url: varchar("url", { length: 1024 }),
  notes: text("notes"),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const knowledgeMaterials = mysqlTable("knowledge_materials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  materialType: varchar("materialType", { length: 60 }).notNull(),
  url: varchar("url", { length: 1024 }),
  storageKey: varchar("storageKey", { length: 1024 }),
  mimeType: varchar("mimeType", { length: 120 }),
  notes: text("notes"),
  isVerified: boolean("isVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const editorialTopics = mysqlTable("editorial_topics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  area: varchar("area", { length: 80 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  audience: varchar("audience", { length: 180 }).notNull(),
  priority: varchar("priority", { length: 20 }).notNull(),
  suggestedFormat: mysqlEnum("suggestedFormat", editorialFormats).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 1024 }),
  tags: text("tags"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const contentPosts = mysqlTable("content_posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  topicId: int("topicId"),
  sourceId: int("sourceId"),
  area: varchar("area", { length: 80 }).notNull(),
  format: mysqlEnum("format", editorialFormats).notNull(),
  audience: varchar("audience", { length: 180 }).notNull(),
  strategicObjective: text("strategicObjective"),
  contentPillar: varchar("contentPillar", { length: 80 }),
  campaign: varchar("campaign", { length: 180 }),
  funnelStage: mysqlEnum("funnelStage", ["discovery", "consideration", "conversion", "relationship"]),
  templateKey: varchar("templateKey", { length: 60 }),
  title: varchar("title", { length: 255 }).notNull(),
  hook: text("hook"),
  caption: text("caption"),
  cta: text("cta"),
  hashtags: text("hashtags"),
  altText: text("altText"),
  keyStatement: text("keyStatement"),
  legalSource: text("legalSource"),
  reviewDueAt: timestamp("reviewDueAt"),
  mediaUrl: varchar("mediaUrl", { length: 2048 }),
  status: mysqlEnum("status", contentStatuses).default("draft").notNull(),
  approvalOwnerId: int("approvalOwnerId"),
  approvalOwnerName: varchar("approvalOwnerName", { length: 180 }),
  approvalNotes: text("approvalNotes"),
  scheduledAt: timestamp("scheduledAt"),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const contentMedia = mysqlTable("content_media", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  postId: int("postId").notNull(),
  storageKey: varchar("storageKey", { length: 1024 }),
  url: varchar("url", { length: 2048 }).notNull(),
  fileName: varchar("fileName", { length: 255 }),
  mimeType: varchar("mimeType", { length: 120 }),
  byteSize: int("byteSize"),
  width: int("width"),
  height: int("height"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("content_media_post_order_idx").on(table.postId, table.sortOrder),
  index("content_media_user_idx").on(table.userId),
]);

export const assetLibraryItems = mysqlTable("asset_library_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sourcePath: varchar("sourcePath", { length: 1024 }).notNull(),
  storageKey: varchar("storageKey", { length: 1024 }).notNull(),
  url: varchar("url", { length: 2048 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  area: varchar("area", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  assetType: mysqlEnum("assetType", ["single", "carousel_slide"]).notNull(),
  groupKey: varchar("groupKey", { length: 160 }),
  slideOrder: int("slideOrder"),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  byteSize: int("byteSize").notNull(),
  width: int("width").notNull(),
  height: int("height").notNull(),
  tags: text("tags"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("asset_library_source_unique").on(table.userId, table.sourcePath),
  index("asset_library_user_area_idx").on(table.userId, table.area),
  index("asset_library_group_order_idx").on(table.userId, table.groupKey, table.slideOrder),
]);

export const approvalLogs = mysqlTable("approval_logs", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  reviewerId: int("reviewerId").notNull(),
  reviewerName: varchar("reviewerName", { length: 180 }),
  decision: mysqlEnum("decision", ["approved", "rejected", "changes_requested"]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const instagramConnections = mysqlTable("instagram_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  instagramUserId: varchar("instagramUserId", { length: 80 }),
  username: varchar("username", { length: 120 }),
  accessTokenCiphertext: text("accessTokenCiphertext"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  permissions: text("permissions"),
  state: mysqlEnum("state", instagramConnectionStates).default("disconnected").notNull(),
  lastError: text("lastError"),
  connectedAt: timestamp("connectedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("instagram_connections_user_unique").on(table.userId),
  index("instagram_connections_state_idx").on(table.state),
]);

export const publicationJobs = mysqlTable("publication_jobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  postId: int("postId").notNull(),
  connectionId: int("connectionId"),
  status: mysqlEnum("status", publicationJobStatuses).default("pending_confirmation").notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 128 }).notNull(),
  frozenPayload: text("frozenPayload").notNull(),
  confirmedAt: timestamp("confirmedAt"),
  confirmedByUserId: int("confirmedByUserId"),
  scheduledAt: timestamp("scheduledAt"),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  testContainerId: varchar("testContainerId", { length: 160 }),
  testedAt: timestamp("testedAt"),
  containerId: varchar("containerId", { length: 160 }),
  mediaId: varchar("mediaId", { length: 160 }),
  permalink: varchar("permalink", { length: 2048 }),
  attemptCount: int("attemptCount").default(0).notNull(),
  lastError: text("lastError"),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("publication_jobs_idempotency_unique").on(table.idempotencyKey),
  index("publication_jobs_user_status_idx").on(table.userId, table.status),
  index("publication_jobs_post_idx").on(table.postId),
  index("publication_jobs_cron_task_idx").on(table.scheduleCronTaskUid),
]);

export const publicationAttempts = mysqlTable("publication_attempts", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  stage: mysqlEnum("stage", publicationAttemptStages).notNull(),
  outcome: mysqlEnum("outcome", publicationAttemptOutcomes).notNull(),
  externalReference: varchar("externalReference", { length: 255 }),
  errorCode: varchar("errorCode", { length: 120 }),
  detail: text("detail"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
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
export type PublicationJob = typeof publicationJobs.$inferSelect;
export type AutomationSetting = typeof automationSettings.$inferSelect;
