SET @campaign_old_idx_exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'campaign_runs'
    AND index_name = 'campaign_runs_idempotency_unique'
);--> statement-breakpoint
SET @campaign_old_idx_sql := IF(
  @campaign_old_idx_exists > 0,
  'ALTER TABLE `campaign_runs` DROP INDEX `campaign_runs_idempotency_unique`',
  'SELECT 1'
);--> statement-breakpoint
PREPARE campaign_old_idx_stmt FROM @campaign_old_idx_sql;--> statement-breakpoint
EXECUTE campaign_old_idx_stmt;--> statement-breakpoint
DEALLOCATE PREPARE campaign_old_idx_stmt;--> statement-breakpoint
SET @campaign_user_idx_exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'campaign_runs'
    AND index_name = 'campaign_runs_user_idempotency_unique'
);--> statement-breakpoint
SET @campaign_user_idx_sql := IF(
  @campaign_user_idx_exists = 0,
  'CREATE UNIQUE INDEX `campaign_runs_user_idempotency_unique` ON `campaign_runs` (`userId`,`idempotencyKey`)',
  'SELECT 1'
);--> statement-breakpoint
PREPARE campaign_user_idx_stmt FROM @campaign_user_idx_sql;--> statement-breakpoint
EXECUTE campaign_user_idx_stmt;--> statement-breakpoint
DEALLOCATE PREPARE campaign_user_idx_stmt;
