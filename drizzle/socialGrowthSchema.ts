import {
  sqliteTable,
  integer,
  text,
  index,
  uniqueIndex,
  sql,
} from "drizzle-orm/sqlite-core";

export const videoProjects = sqliteTable("video_projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  postId: integer("postId"),
  title: text("title").notNull(),
  platform: text("platform").notNull(),
  durationSeconds: integer("durationSeconds").default(30).notNull(),
  hook: text("hook"),
  script: text("script"),
  shotListJson: text("shotListJson"),
  onScreenTextJson: text("onScreenTextJson"),
  thumbnailBrief: text("thumbnailBrief"),
  recordingGuidance: text("recordingGuidance"),
  status: text("status").default("brief").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
}, table => [index("video_projects_user_status_idx").on(table.userId, table.status)]);

export const seoAudits = sqliteTable("seo_audits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  scope: text("scope").notNull(),
  targetUrl: text("targetUrl"),
  location: text("location"),
  keyword: text("keyword"),
  score: integer("score").default(0).notNull(),
  findingsJson: text("findingsJson").notNull(),
  recommendationsJson: text("recommendationsJson").notNull(),
  status: text("status").default("draft").notNull(),
  auditedAt: integer("auditedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
}, table => [index("seo_audits_user_scope_idx").on(table.userId, table.scope)]);

export const adPlans = sqliteTable("ad_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  platform: text("platform").notNull(),
  name: text("name").notNull(),
  objective: text("objective").notNull(),
  audienceJson: text("audienceJson").notNull(),
  locationJson: text("locationJson"),
  offer: text("offer"),
  budgetCents: integer("budgetCents"),
  durationDays: integer("durationDays"),
  conversionEvent: text("conversionEvent"),
  maxAcceptableCostCents: integer("maxAcceptableCostCents"),
  successMetric: text("successMetric"),
  creativeBriefJson: text("creativeBriefJson"),
  landingPageUrl: text("landingPageUrl"),
  status: text("status").default("draft").notNull(),
  requiresApproval: integer("requiresApproval", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
}, table => [index("ad_plans_user_status_idx").on(table.userId, table.status)]);

export const performanceInsights = sqliteTable("performance_insights", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  insightType: text("insightType").notNull(),
  title: text("title").notNull(),
  evidenceJson: text("evidenceJson").notNull(),
  recommendation: text("recommendation").notNull(),
  confidenceScore: integer("confidenceScore").default(0).notNull(),
  active: integer("active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
}, table => [index("performance_insights_user_active_idx").on(table.userId, table.active)]);

export const brandMemoryItems = sqliteTable("brand_memory_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  memoryType: text("memoryType").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  sourceReference: text("sourceReference"),
  confidenceScore: integer("confidenceScore").default(50).notNull(),
  active: integer("active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
}, table => [index("brand_memory_user_type_idx").on(table.userId, table.memoryType)]);

export const agentRuns = sqliteTable("agent_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  agentType: text("agentType").notNull(),
  entityType: text("entityType"),
  entityId: text("entityId"),
  inputSummary: text("inputSummary"),
  outputSummary: text("outputSummary"),
  status: text("status").default("started").notNull(),
  durationMs: integer("durationMs"),
  errorMessage: text("errorMessage"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  completedAt: integer("completedAt", { mode: "timestamp" }),
}, table => [index("agent_runs_user_agent_idx").on(table.userId, table.agentType)]);

export const complianceChecks = sqliteTable("compliance_checks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  postId: integer("postId"),
  adPlanId: integer("adPlanId"),
  checkType: text("checkType").notNull(),
  result: text("result").notNull(),
  findingsJson: text("findingsJson").notNull(),
  checkedBy: text("checkedBy").default("system").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
}, table => [index("compliance_checks_user_result_idx").on(table.userId, table.result)]);

export const generatedReports = sqliteTable("generated_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  reportType: text("reportType").notNull(),
  periodStart: integer("periodStart", { mode: "timestamp" }).notNull(),
  periodEnd: integer("periodEnd", { mode: "timestamp" }).notNull(),
  summary: text("summary").notNull(),
  metricsJson: text("metricsJson").notNull(),
  findingsJson: text("findingsJson").notNull(),
  recommendationsJson: text("recommendationsJson").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
}, table => [index("generated_reports_user_period_idx").on(table.userId, table.periodEnd)]);
