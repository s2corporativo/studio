SET @publication_old_idx_exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'publication_jobs'
    AND index_name = 'publication_jobs_idempotency_unique'
);--> statement-breakpoint
SET @publication_old_idx_sql := IF(
  @publication_old_idx_exists > 0,
  'ALTER TABLE `publication_jobs` DROP INDEX `publication_jobs_idempotency_unique`',
  'SELECT 1'
);--> statement-breakpoint
PREPARE publication_old_idx_stmt FROM @publication_old_idx_sql;--> statement-breakpoint
EXECUTE publication_old_idx_stmt;--> statement-breakpoint
DEALLOCATE PREPARE publication_old_idx_stmt;--> statement-breakpoint
SET @publication_user_idx_exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'publication_jobs'
    AND index_name = 'publication_jobs_user_idempotency_unique'
);--> statement-breakpoint
SET @publication_user_idx_sql := IF(
  @publication_user_idx_exists = 0,
  'CREATE UNIQUE INDEX `publication_jobs_user_idempotency_unique` ON `publication_jobs` (`userId`,`idempotencyKey`)',
  'SELECT 1'
);--> statement-breakpoint
PREPARE publication_user_idx_stmt FROM @publication_user_idx_sql;--> statement-breakpoint
EXECUTE publication_user_idx_stmt;--> statement-breakpoint
DEALLOCATE PREPARE publication_user_idx_stmt;
