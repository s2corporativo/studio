CREATE TABLE IF NOT EXISTS `external_publication_jobs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `provider` enum('facebook','linkedin','tiktok','youtube','google_business','meta_ads','google_ads') NOT NULL,
  `externalConnectionId` int NOT NULL,
  `postId` int NOT NULL,
  `approvalHash` varchar(64) NOT NULL,
  `idempotencyKey` varchar(64) NOT NULL,
  `frozenPayload` text NOT NULL,
  `status` enum('pending_confirmation','processing','published','failed','cancelled') NOT NULL DEFAULT 'pending_confirmation',
  `confirmedByUserId` int,
  `confirmedAt` timestamp NULL,
  `attemptCount` int NOT NULL DEFAULT 0,
  `externalPostId` varchar(255),
  `lastError` text,
  `publishedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `external_publication_jobs_id` PRIMARY KEY(`id`),
  CONSTRAINT `external_publication_jobs_idempotency_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE INDEX `external_publication_jobs_user_provider_status_idx` ON `external_publication_jobs` (`userId`,`provider`,`status`);
--> statement-breakpoint
CREATE INDEX `external_publication_jobs_post_idx` ON `external_publication_jobs` (`userId`,`postId`);
