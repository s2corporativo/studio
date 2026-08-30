import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const videoProjects = mysqlTable("video_projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  postId: int("postId"),
  title: varchar("title", { length: 255 }).notNull(),
  platform: varchar("platform", { length: 40 }).notNull(),
  durationSeconds: int("durationSeconds").default(30).notNull(),
  hook: text("hook"),
  script: text("script"),
  shotListJson: text("shotListJson"),
  onScreenTextJson: text("onScreenTextJson"),
  thumbnailBrief: text("thumbnailBrief"),
  recordingGuidance: text("recordingGuidance"),
  status: mysqlEnum("status", ["brief", "scripted", "approved", "produced"]).default("brief").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("video_projects_user_status_idx").on(table.userId, table.status)]);

export const seoAudits = mysqlTable("seo_audits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  scope: mysqlEnum("scope", ["site", "local", "content", "technical"]).notNull(),
  targetUrl: varchar("targetUrl", { length: 2048 }),
  location: varchar("location", { length: 180 }),
  keyword: varchar("keyword", { length: 255 }),
  score: int("score").default(0).notNull(),
  findingsJson: text("findingsJson").notNull(),
  recommendationsJson: text("recommendationsJson").notNull(),
  status: mysqlEnum("status", ["draft", "ready", "applied", "archived"]).default("draft").notNull(),
  auditedAt: timestamp("auditedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("seo_audits_user_scope_idx").on(table.userId, table.scope)]);

export const adPlans = mysqlTable("ad_plans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  platform: mysqlEnum("platform", ["meta", "google", "youtube", "linkedin", "tiktok"]).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  objective: varchar("objective", { length: 180 }).notNull(),
  audienceJson: text("audienceJson").notNull(),
  locationJson: text("locationJson"),
  offer: text("offer"),
  budgetCents: int("budgetCents"),
  durationDays: int("durationDays"),
  conversionEvent: varchar("conversionEvent", { length: 120 }),
  maxAcceptableCostCents: int("maxAcceptableCostCents"),
  successMetric: varchar("successMetric", { length: 120 }),
  creativeBriefJson: text("creativeBriefJson"),
  landingPageUrl: varchar("landingPageUrl", { length: 2048 }),
  status: mysqlEnum("status", ["draft", "approved", "published", "paused", "archived"]).default("draft").notNull(),
  requiresApproval: boolean("requiresApproval").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("ad_plans_user_status_idx").on(table.userId, table.status)]);

export const performanceInsights = mysqlTable("performance_insights", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  insightType: mysqlEnum("insightType", ["topic", "format", "schedule", "cta", "audience", "channel"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  evidenceJson: text("evidenceJson").notNull(),
  recommendation: text("recommendation").notNull(),
  confidenceScore: int("confidenceScore").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("performance_insights_user_active_idx").on(table.userId, table.active)]);

export const brandMemoryItems = mysqlTable("brand_memory_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  memoryType: mysqlEnum("memoryType", ["winning_pattern", "avoid_pattern", "audience_learning", "creative_rule", "copy_rule", "channel_rule"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  sourceReference: varchar("sourceReference", { length: 1024 }),
  confidenceScore: int("confidenceScore").default(50).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("brand_memory_user_type_idx").on(table.userId, table.memoryType)]);

export const agentRuns = mysqlTable("agent_runs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agentType: mysqlEnum("agentType", ["strategist", "researcher", "copywriter", "creative_director", "designer", "reviewer", "compliance", "publisher", "analyst"]).notNull(),
  entityType: varchar("entityType", { length: 80 }),
  entityId: varchar("entityId", { length: 120 }),
  inputSummary: text("inputSummary"),
  outputSummary: text("outputSummary"),
  status: mysqlEnum("status", ["started", "completed", "failed", "blocked_human"]).default("started").notNull(),
  durationMs: int("durationMs"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, table => [index("agent_runs_user_agent_idx").on(table.userId, table.agentType)]);

export const complianceChecks = mysqlTable("compliance_checks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  postId: int("postId"),
  adPlanId: int("adPlanId"),
  checkType: mysqlEnum("checkType", ["legal_advertising", "lgpd", "copyright", "source_integrity", "platform_policy", "brand_safety"]).notNull(),
  result: mysqlEnum("result", ["passed", "warning", "blocked", "needs_human"]).notNull(),
  findingsJson: text("findingsJson").notNull(),
  checkedBy: mysqlEnum("checkedBy", ["system", "human"]).default("system").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("compliance_checks_user_result_idx").on(table.userId, table.result)]);

export const generatedReports = mysqlTable("generated_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  reportType: mysqlEnum("reportType", ["weekly", "monthly", "campaign", "executive"]).notNull(),
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  summary: text("summary").notNull(),
  metricsJson: text("metricsJson").notNull(),
  findingsJson: text("findingsJson").notNull(),
  recommendationsJson: text("recommendationsJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("generated_reports_user_period_idx").on(table.userId, table.periodEnd)]);
