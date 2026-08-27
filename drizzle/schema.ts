import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
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
});

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

export const approvalLogs = mysqlTable("approval_logs", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  reviewerId: int("reviewerId").notNull(),
  reviewerName: varchar("reviewerName", { length: 180 }),
  decision: mysqlEnum("decision", ["approved", "rejected", "changes_requested"]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ContentPost = typeof contentPosts.$inferSelect;
export type EditorialTopic = typeof editorialTopics.$inferSelect;
export type BrandProfile = typeof brandProfiles.$inferSelect;
export type ContentStatus = (typeof contentStatuses)[number];
