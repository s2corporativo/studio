import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const autonomyProfiles = mysqlTable("autonomy_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  level: mysqlEnum("level", ["manual", "assisted", "semi_automatic", "autopilot"]).default("assisted").notNull(),
  allowAutoResearch: boolean("allowAutoResearch").default(true).notNull(),
  allowAutoDraft: boolean("allowAutoDraft").default(false).notNull(),
  allowAutoSchedule: boolean("allowAutoSchedule").default(false).notNull(),
  requireHumanForLegalContent: boolean("requireHumanForLegalContent").default(true).notNull(),
  requireHumanForExternalPublish: boolean("requireHumanForExternalPublish").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("autonomy_profiles_user_unique").on(table.userId)]);

export const automationExecutions = mysqlTable("automation_executions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ruleId: int("ruleId").notNull(),
  fingerprint: varchar("fingerprint", { length: 64 }).notNull(),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityId: varchar("entityId", { length: 120 }).notNull(),
  triggerSnapshotJson: text("triggerSnapshotJson").notNull(),
  actionSnapshotJson: text("actionSnapshotJson").notNull(),
  status: mysqlEnum("status", ["pending_approval", "queued", "running", "completed", "skipped", "failed"]).default("pending_approval").notNull(),
  requiresHumanApproval: boolean("requiresHumanApproval").default(true).notNull(),
  approvedByUserId: int("approvedByUserId"),
  approvedAt: timestamp("approvedAt"),
  resultJson: text("resultJson"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("automation_executions_fingerprint_unique").on(table.userId, table.fingerprint),
  index("automation_executions_user_status_idx").on(table.userId, table.status),
  index("automation_executions_rule_idx").on(table.userId, table.ruleId),
]);
