CREATE TABLE IF NOT EXISTS `brand_workspaces` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `key` varchar(120) NOT NULL,
  `name` varchar(180) NOT NULL,
  `segment` varchar(180),
  `location` varchar(180),
  `targetAudience` text,
  `commercialGoal` text,
  `toneOfVoice` text,
  `primaryCta` text,
  `prohibitedTerms` text,
  `visualGuidelines` text,
  `websiteUrl` varchar(1024),
  `whatsapp` varchar(80),
  `status` enum('active','archived') NOT NULL DEFAULT 'active',
  `isDefault` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `brand_workspaces_id` PRIMARY KEY(`id`),
  CONSTRAINT `brand_workspaces_user_key_unique` UNIQUE(`userId`,`key`),
  INDEX `brand_workspaces_user_default_idx` (`userId`,`isDefault`),
  INDEX `brand_workspaces_user_status_idx` (`userId`,`status`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `brand_content_bindings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `brandWorkspaceId` int NOT NULL,
  `postId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `brand_content_bindings_id` PRIMARY KEY(`id`),
  CONSTRAINT `brand_content_bindings_user_post_unique` UNIQUE(`userId`,`postId`),
  INDEX `brand_content_bindings_workspace_idx` (`userId`,`brandWorkspaceId`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `brand_memory_snapshots` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `brandWorkspaceId` int NOT NULL,
  `version` int NOT NULL,
  `contentHash` varchar(64) NOT NULL,
  `memoryJson` text NOT NULL,
  `source` varchar(120) NOT NULL DEFAULT 'system',
  `active` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `brand_memory_snapshots_id` PRIMARY KEY(`id`),
  CONSTRAINT `brand_memory_workspace_version_unique` UNIQUE(`brandWorkspaceId`,`version`),
  INDEX `brand_memory_user_workspace_active_idx` (`userId`,`brandWorkspaceId`,`active`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `performance_learnings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `brandWorkspaceId` int NOT NULL,
  `dimension` enum('topic','format','schedule','cta','audience','channel','visual_family','humanization') NOT NULL,
  `key` varchar(180) NOT NULL,
  `sampleSize` int NOT NULL DEFAULT 0,
  `evidenceJson` text NOT NULL,
  `recommendation` text NOT NULL,
  `confidenceScore` int NOT NULL DEFAULT 0,
  `active` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `performance_learnings_id` PRIMARY KEY(`id`),
  CONSTRAINT `performance_learnings_workspace_dimension_key_unique` UNIQUE(`brandWorkspaceId`,`dimension`,`key`),
  INDEX `performance_learnings_user_workspace_active_idx` (`userId`,`brandWorkspaceId`,`active`)
);
--> statement-breakpoint
INSERT INTO `brand_workspaces` (`userId`,`key`,`name`,`segment`,`location`,`targetAudience`,`commercialGoal`,`toneOfVoice`,`primaryCta`,`prohibitedTerms`,`visualGuidelines`,`websiteUrl`,`whatsapp`,`status`,`isDefault`)
SELECT bp.`userId`, CONCAT('legacy-', bp.`userId`), bp.`brandName`, bp.`segment`, bp.`location`, bp.`targetAudience`, bp.`commercialGoal`, bp.`toneOfVoice`, bp.`primaryCta`, bp.`prohibitedTerms`, bp.`visualGuidelines`, bp.`websiteUrl`, bp.`whatsapp`, 'active', true
FROM `brand_profiles` bp
LEFT JOIN `brand_workspaces` bw ON bw.`userId` = bp.`userId` AND bw.`isDefault` = true
WHERE bw.`id` IS NULL;
--> statement-breakpoint
INSERT INTO `brand_content_bindings` (`userId`,`brandWorkspaceId`,`postId`)
SELECT p.`userId`, bw.`id`, p.`id`
FROM `content_posts` p
JOIN `brand_workspaces` bw ON bw.`userId` = p.`userId` AND bw.`isDefault` = true
LEFT JOIN `brand_content_bindings` b ON b.`userId` = p.`userId` AND b.`postId` = p.`id`
WHERE b.`id` IS NULL;
