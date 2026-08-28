CREATE TABLE `social_profiles` (
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
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `social_profiles_user_network_url_unique` UNIQUE(`userId`,`network`,`profileUrl`)
);
--> statement-breakpoint
CREATE INDEX `social_profiles_user_network_idx` ON `social_profiles` (`userId`,`network`);--> statement-breakpoint
CREATE INDEX `social_profiles_user_state_idx` ON `social_profiles` (`userId`,`state`);
