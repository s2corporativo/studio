CREATE TABLE IF NOT EXISTS `content_opportunities` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `sourceUrl` varchar(2048), `sourceName` varchar(180), `title` varchar(500) NOT NULL,
  `summary` text, `area` varchar(120), `locality` varchar(180),
  `relevanceScore` int NOT NULL DEFAULT 0, `freshnessScore` int NOT NULL DEFAULT 0,
  `authorityScore` int NOT NULL DEFAULT 0, `commercialScore` int NOT NULL DEFAULT 0,
  `riskScore` int NOT NULL DEFAULT 0, `totalScore` int NOT NULL DEFAULT 0,
  `rationale` text, `status` enum('new','selected','dismissed','converted') NOT NULL DEFAULT 'new',
  `detectedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `content_opportunities_id` PRIMARY KEY(`id`),
  INDEX `content_opportunities_user_score_idx` (`userId`,`totalScore`),
  INDEX `content_opportunities_user_status_idx` (`userId`,`status`)
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `post_versions` (
  `id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL, `postId` int NOT NULL,
  `version` int NOT NULL, `contentHash` varchar(64) NOT NULL, `snapshotJson` text NOT NULL,
  `changeReason` varchar(255), `createdByUserId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `post_versions_id` PRIMARY KEY(`id`),
  UNIQUE INDEX `post_versions_post_version_unique` (`postId`,`version`),
  INDEX `post_versions_user_post_idx` (`userId`,`postId`)
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `post_approval_bindings` (
  `id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL, `postId` int NOT NULL,
  `versionId` int NOT NULL, `contentHash` varchar(64) NOT NULL, `approvedByUserId` int NOT NULL,
  `approvedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `invalidatedAt` timestamp NULL,
  `invalidationReason` varchar(255),
  CONSTRAINT `post_approval_bindings_id` PRIMARY KEY(`id`),
  INDEX `post_approval_bindings_post_idx` (`userId`,`postId`)
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `campaign_runs` (
  `id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL, `idempotencyKey` varchar(128) NOT NULL,
  `name` varchar(180) NOT NULL, `horizonDays` int NOT NULL, `postsPerWeek` int NOT NULL,
  `timezone` varchar(80) NOT NULL DEFAULT 'America/Sao_Paulo',
  `status` enum('planning','generated','failed') NOT NULL DEFAULT 'planning',
  `generatedCount` int NOT NULL DEFAULT 0, `errorMessage` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `campaign_runs_id` PRIMARY KEY(`id`),
  UNIQUE INDEX `campaign_runs_idempotency_unique` (`idempotencyKey`),
  INDEX `campaign_runs_user_idx` (`userId`,`createdAt`)
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `social_interactions` (
  `id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL, `socialProfileId` int,
  `network` varchar(40) NOT NULL, `externalId` varchar(180), `authorName` varchar(180),
  `authorHandle` varchar(180), `body` text NOT NULL,
  `kind` enum('question','praise','complaint','quote','support','opportunity','spam','legal_risk','sensitive') NOT NULL DEFAULT 'question',
  `status` enum('open','triaged','waiting_human','resolved','ignored') NOT NULL DEFAULT 'open',
  `aiSuggestedReply` text, `requiresHumanApproval` boolean NOT NULL DEFAULT false,
  `receivedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `social_interactions_id` PRIMARY KEY(`id`),
  INDEX `social_interactions_user_status_idx` (`userId`,`status`),
  INDEX `social_interactions_user_kind_idx` (`userId`,`kind`)
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `leads` (
  `id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL, `source` varchar(120) NOT NULL,
  `sourceInteractionId` int, `name` varchar(180), `contact` varchar(320), `interest` varchar(255),
  `notes` text, `status` enum('new','qualified','contacted','won','lost') NOT NULL DEFAULT 'new',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `leads_id` PRIMARY KEY(`id`), INDEX `leads_user_status_idx` (`userId`,`status`)
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `competitors` (
  `id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL, `name` varchar(180) NOT NULL,
  `websiteUrl` varchar(1024), `instagramUrl` varchar(1024), `linkedinUrl` varchar(1024),
  `notes` text, `active` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `competitors_id` PRIMARY KEY(`id`), INDEX `competitors_user_idx` (`userId`,`active`)
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `content_metrics` (
  `id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL, `postId` int NOT NULL, `network` varchar(40) NOT NULL,
  `impressions` int NOT NULL DEFAULT 0, `reach` int NOT NULL DEFAULT 0, `likes` int NOT NULL DEFAULT 0,
  `comments` int NOT NULL DEFAULT 0, `shares` int NOT NULL DEFAULT 0, `saves` int NOT NULL DEFAULT 0,
  `clicks` int NOT NULL DEFAULT 0, `leads` int NOT NULL DEFAULT 0,
  `capturedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `content_metrics_id` PRIMARY KEY(`id`), INDEX `content_metrics_user_post_idx` (`userId`,`postId`)
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `creative_evaluations` (
  `id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL, `postId` int NOT NULL,
  `mediaUrl` varchar(2048) NOT NULL, `visualQuality` int NOT NULL DEFAULT 0, `brandFit` int NOT NULL DEFAULT 0,
  `legibility` int NOT NULL DEFAULT 0, `attentionPotential` int NOT NULL DEFAULT 0,
  `aiAppearanceRisk` int NOT NULL DEFAULT 0, `notes` text, `passed` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `creative_evaluations_id` PRIMARY KEY(`id`), INDEX `creative_evaluations_user_post_idx` (`userId`,`postId`)
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `automation_rules` (
  `id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL, `name` varchar(180) NOT NULL,
  `enabled` boolean NOT NULL DEFAULT false,
  `triggerType` enum('schedule','opportunity_score','interaction_kind','metric_threshold') NOT NULL,
  `triggerConfigJson` text NOT NULL,
  `actionType` enum('create_draft','request_approval','suggest_reply','create_lead','create_report') NOT NULL,
  `actionConfigJson` text NOT NULL, `requiresHumanApproval` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `automation_rules_id` PRIMARY KEY(`id`), INDEX `automation_rules_user_idx` (`userId`,`enabled`)
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `audit_events` (
  `id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL, `actorUserId` int,
  `entityType` varchar(80) NOT NULL, `entityId` varchar(120), `action` varchar(120) NOT NULL,
  `detailJson` text, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `audit_events_id` PRIMARY KEY(`id`), INDEX `audit_events_user_created_idx` (`userId`,`createdAt`)
);
