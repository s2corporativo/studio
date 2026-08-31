CREATE TABLE IF NOT EXISTS `social_profiles` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `network` enum('instagram','facebook','linkedin','tiktok','youtube') NOT NULL,
  `displayName` varchar(160) NOT NULL,
  `handle` varchar(160),
  `profileUrl` varchar(1024) NOT NULL,
  `externalAccountId` varchar(160),
  `connectionMode` enum('manual','oauth') NOT NULL DEFAULT 'manual',
  `state` enum('active','inactive','pending_oauth','connected','error') NOT NULL DEFAULT 'active',
  `notes` text,
  `verifiedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `social_profiles_id` PRIMARY KEY(`id`),
  UNIQUE INDEX `social_profiles_user_network_url_unique` (`userId`,`network`,`profileUrl`),
  INDEX `social_profiles_user_network_idx` (`userId`,`network`),
  INDEX `social_profiles_user_state_idx` (`userId`,`state`)
);
