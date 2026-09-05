CREATE TABLE IF NOT EXISTS `hashtag_groups` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `name` varchar(180) NOT NULL,
  `area` varchar(120),
  `tags` text NOT NULL,
  `description` text,
  `usageCount` int NOT NULL DEFAULT 0,
  `lastUsedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `hashtag_groups_id` PRIMARY KEY (`id`),
  UNIQUE INDEX `hashtag_groups_user_name_unique` (`userId`, `name`),
  INDEX `hashtag_groups_user_usage_idx` (`userId`, `usageCount`)
);
