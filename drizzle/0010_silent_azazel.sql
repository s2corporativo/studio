SET @social_profile_col_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'instagram_connections'
    AND column_name = 'socialProfileId'
);--> statement-breakpoint
SET @social_profile_col_sql := IF(
  @social_profile_col_exists = 0,
  'ALTER TABLE `instagram_connections` ADD `socialProfileId` int',
  'SELECT 1'
);--> statement-breakpoint
PREPARE social_profile_col_stmt FROM @social_profile_col_sql;--> statement-breakpoint
EXECUTE social_profile_col_stmt;--> statement-breakpoint
DEALLOCATE PREPARE social_profile_col_stmt;--> statement-breakpoint
SET @social_profile_idx_exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'instagram_connections'
    AND index_name = 'instagram_connections_profile_idx'
);--> statement-breakpoint
SET @social_profile_idx_sql := IF(
  @social_profile_idx_exists = 0,
  'CREATE INDEX `instagram_connections_profile_idx` ON `instagram_connections` (`socialProfileId`)',
  'SELECT 1'
);--> statement-breakpoint
PREPARE social_profile_idx_stmt FROM @social_profile_idx_sql;--> statement-breakpoint
EXECUTE social_profile_idx_stmt;--> statement-breakpoint
DEALLOCATE PREPARE social_profile_idx_stmt;
