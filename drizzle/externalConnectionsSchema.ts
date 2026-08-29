import { index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const externalConnectionProviders = ["facebook", "linkedin", "tiktok", "youtube", "google_business", "meta_ads", "google_ads"] as const;
export const externalConnectionStates = ["pending", "connected", "expired", "error", "disconnected"] as const;
export const externalPublicationJobStates = ["pending_confirmation", "processing", "published", "failed", "cancelled"] as const;

export const externalConnections = mysqlTable("external_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  socialProfileId: int("socialProfileId"),
  provider: mysqlEnum("provider", externalConnectionProviders).notNull(),
  externalAccountId: varchar("externalAccountId", { length: 191 }).notNull(),
  accountName: varchar("accountName", { length: 191 }),
  accessTokenCiphertext: text("accessTokenCiphertext").notNull(),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  permissions: text("permissions"),
  metadataJson: text("metadataJson"),
  state: mysqlEnum("state", externalConnectionStates).default("pending").notNull(),
  lastError: text("lastError"),
  connectedAt: timestamp("connectedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("external_connections_user_provider_account_unique").on(table.userId, table.provider, table.externalAccountId),
  index("external_connections_user_provider_state_idx").on(table.userId, table.provider, table.state),
  index("external_connections_profile_idx").on(table.socialProfileId),
]);

export const externalPublicationJobs = mysqlTable("external_publication_jobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: mysqlEnum("provider", externalConnectionProviders).notNull(),
  externalConnectionId: int("externalConnectionId").notNull(),
  postId: int("postId").notNull(),
  approvalHash: varchar("approvalHash", { length: 64 }).notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 64 }).notNull(),
  frozenPayload: text("frozenPayload").notNull(),
  status: mysqlEnum("status", externalPublicationJobStates).default("pending_confirmation").notNull(),
  confirmedByUserId: int("confirmedByUserId"),
  confirmedAt: timestamp("confirmedAt"),
  attemptCount: int("attemptCount").default(0).notNull(),
  externalPostId: varchar("externalPostId", { length: 255 }),
  lastError: text("lastError"),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("external_publication_jobs_idempotency_unique").on(table.idempotencyKey),
  index("external_publication_jobs_user_provider_status_idx").on(table.userId, table.provider, table.status),
  index("external_publication_jobs_post_idx").on(table.userId, table.postId),
]);

export type ExternalConnection = typeof externalConnections.$inferSelect;
export type ExternalPublicationJob = typeof externalPublicationJobs.$inferSelect;
