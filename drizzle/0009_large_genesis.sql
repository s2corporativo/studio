SET @brand_unique_exists := (
  SELECT COUNT(*) FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'brand_profiles'
    AND constraint_name = 'brand_profiles_user_unique'
);
SET @brand_unique_sql := IF(
  @brand_unique_exists = 0,
  'ALTER TABLE `brand_profiles` ADD CONSTRAINT `brand_profiles_user_unique` UNIQUE (`userId`)',
  'SELECT 1'
);
PREPARE brand_unique_stmt FROM @brand_unique_sql;
EXECUTE brand_unique_stmt;
DEALLOCATE PREPARE brand_unique_stmt;

CREATE TABLE IF NOT EXISTS `automation_settings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `enabled` boolean NOT NULL DEFAULT false,
  `cadence` enum('daily','weekdays','custom') NOT NULL DEFAULT 'weekdays',
  `postsPerWeek` int NOT NULL DEFAULT 5,
  `defaultPublishTime` varchar(5) NOT NULL DEFAULT '18:30',
  `planningHorizonDays` int NOT NULL DEFAULT 30,
  `requireApproval` boolean NOT NULL DEFAULT true,
  `refreshRadarDaily` boolean NOT NULL DEFAULT true,
  `preferredAreas` text,
  `preferredFormats` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `automation_settings_id` PRIMARY KEY(`id`),
  CONSTRAINT `automation_settings_user_unique` UNIQUE(`userId`)
);
