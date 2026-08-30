import {
  sqliteTable,
  integer,
  text,
  index,
  uniqueIndex,
  sql,
} from "drizzle-orm/sqlite-core";

export const autonomyProfiles = sqliteTable("autonomy_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  level: text("level").default("assisted").notNull(),
  allowAutoResearch: integer("allowAutoResearch", { mode: "boolean" }).default(true).notNull(),
  allowAutoDraft: integer("allowAutoDraft", { mode: "boolean" }).default(false).notNull(),
  allowAutoSchedule: integer("allowAutoSchedule", { mode: "boolean" }).default(false).notNull(),
  requireHumanForLegalContent: integer("requireHumanForLegalContent", { mode: "boolean" }).default(true).notNull(),
  requireHumanForExternalPublish: integer("requireHumanForExternalPublish", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
}, table => [uniqueIndex("autonomy_profiles_user_unique").on(table.userId)]);

export const automationExecutions = sqliteTable("automation_executions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  ruleId: integer("ruleId").notNull(),
  fingerprint: text("fingerprint").notNull(),
  entityType: text("entityType").notNull(),
  entityId: text("entityId").notNull(),
  triggerSnapshotJson: text("triggerSnapshotJson").notNull(),
  actionSnapshotJson: text("actionSnapshotJson").notNull(),
  status: text("status").default("pending_approval").notNull(),
  requiresHumanApproval: integer("requiresHumanApproval", { mode: "boolean" }).default(true).notNull(),
  approvedByUserId: integer("approvedByUserId"),
  approvedAt: integer("approvedAt", { mode: "timestamp" }),
  resultJson: text("resultJson"),
  errorMessage: text("errorMessage"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()).notNull(),
}, table => [
  uniqueIndex("automation_executions_fingerprint_unique").on(table.userId, table.fingerprint),
  index("automation_executions_user_status_idx").on(table.userId, table.status),
  index("automation_executions_rule_idx").on(table.userId, table.ruleId),
]);
