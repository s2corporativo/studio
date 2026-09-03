CREATE TABLE `instagram_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`instagramUserId` varchar(80),
	`username` varchar(120),
	`accessTokenCiphertext` text,
	`tokenExpiresAt` timestamp,
	`permissions` text,
	`state` enum('disconnected','pending','connected','expired','error') NOT NULL DEFAULT 'disconnected',
	`lastError` text,
	`connectedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `instagram_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `instagram_connections_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `publication_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`stage` enum('preflight','container','publish','schedule','callback') NOT NULL,
	`outcome` enum('started','succeeded','failed','skipped') NOT NULL,
	`externalReference` varchar(255),
	`errorCode` varchar(120),
	`detail` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `publication_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `publication_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`postId` int NOT NULL,
	`connectionId` int,
	`status` enum('pending_confirmation','queued','processing','published','failed','cancelled') NOT NULL DEFAULT 'pending_confirmation',
	`idempotencyKey` varchar(128) NOT NULL,
	`frozenPayload` text NOT NULL,
	`confirmedAt` timestamp,
	`confirmedByUserId` int,
	`scheduledAt` timestamp,
	`scheduleCronTaskUid` varchar(65),
	`containerId` varchar(160),
	`mediaId` varchar(160),
	`permalink` varchar(2048),
	`attemptCount` int NOT NULL DEFAULT 0,
	`lastError` text,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `publication_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `publication_jobs_idempotency_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE INDEX `instagram_connections_state_idx` ON `instagram_connections` (`state`);--> statement-breakpoint
CREATE INDEX `publication_attempts_job_idx` ON `publication_attempts` (`jobId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `publication_jobs_user_status_idx` ON `publication_jobs` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `publication_jobs_post_idx` ON `publication_jobs` (`postId`);--> statement-breakpoint
CREATE INDEX `publication_jobs_cron_task_idx` ON `publication_jobs` (`scheduleCronTaskUid`);