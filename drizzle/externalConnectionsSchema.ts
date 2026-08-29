import { index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const externalConnectionProviders = ["facebook", "linkedin", "tiktok", "youtube", "google_business", "meta_ads", "google_ads"] as const;
export const externalConnectionStates = ["pending", "connected", "expired", "error", "disconnected"] as const;

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

export type ExternalConnection = typeof externalConnections.$inferSelect;
