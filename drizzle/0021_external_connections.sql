CREATE TABLE IF NOT EXISTS `external_connections` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `socialProfileId` int,
  `provider` enum('facebook','linkedin','tiktok','youtube','google_business','meta_ads','google_ads') NOT NULL,
  `externalAccountId` varchar(191) NOT NULL,
  `accountName` varchar(191),
  `accessTokenCiphertext` text NOT NULL,
  `tokenExpiresAt` timestamp NULL,
  `permissions` text,
  `metadataJson` text,
  `state` enum('pending','connected','expired','error','disconnected') NOT NULL DEFAULT 'pending',
  `lastError` text,
  `connectedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `external_connections_id` PRIMARY KEY(`id`),
  CONSTRAINT `external_connections_user_provider_account_unique` UNIQUE(`userId`,`provider`,`externalAccountId`)
);
--> statement-breakpoint
CREATE INDEX `external_connections_user_provider_state_idx` ON `external_connections` (`userId`,`provider`,`state`);
--> statement-breakpoint
CREATE INDEX `external_connections_profile_idx` ON `external_connections` (`socialProfileId`);
