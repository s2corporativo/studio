CREATE TABLE IF NOT EXISTS `video_projects` (
  `id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL, `postId` int,
  `title` varchar(255) NOT NULL, `platform` varchar(40) NOT NULL, `durationSeconds` int NOT NULL DEFAULT 30,
  `hook` text, `script` text, `shotListJson` text, `onScreenTextJson` text, `thumbnailBrief` text, `recordingGuidance` text,
  `status` enum('brief','scripted','approved','produced') NOT NULL DEFAULT 'brief',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `video_projects_id` PRIMARY KEY(`id`), INDEX `video_projects_user_status_idx` (`userId`,`status`)
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `seo_audits` (
  `id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL,
  `scope` enum('site','local','content','technical') NOT NULL, `targetUrl` varchar(2048), `location` varchar(180), `keyword` varchar(255),
  `score` int NOT NULL DEFAULT 0, `findingsJson` text NOT NULL, `recommendationsJson` text NOT NULL,
  `status` enum('draft','ready','applied','archived') NOT NULL DEFAULT 'draft',
  `auditedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `seo_audits_id` PRIMARY KEY(`id`), INDEX `seo_audits_user_scope_idx` (`userId`,`scope`)
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `ad_plans` (
  `id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL,
  `platform` enum('meta','google','youtube','linkedin','tiktok') NOT NULL,
  `name` varchar(180) NOT NULL, `objective` varchar(180) NOT NULL, `audienceJson` text NOT NULL, `locationJson` text,
  `offer` text, `budgetCents` int, `durationDays` int, `conversionEvent` varchar(120), `maxAcceptableCostCents` int,
  `successMetric` varchar(120), `creativeBriefJson` text, `landingPageUrl` varchar(2048),
  `status` enum('draft','approved','published','paused','archived') NOT NULL DEFAULT 'draft',
  `requiresApproval` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `ad_plans_id` PRIMARY KEY(`id`), INDEX `ad_plans_user_status_idx` (`userId`,`status`)
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `performance_insights` (
  `id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL,
  `insightType` enum('topic','format','schedule','cta','audience','channel') NOT NULL,
  `title` varchar(255) NOT NULL, `evidenceJson` text NOT NULL, `recommendation` text NOT NULL,
  `confidenceScore` int NOT NULL DEFAULT 0, `active` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `performance_insights_id` PRIMARY KEY(`id`), INDEX `performance_insights_user_active_idx` (`userId`,`active`)
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `brand_memory_items` (
  `id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL,
  `memoryType` enum('winning_pattern','avoid_pattern','audience_learning','creative_rule','copy_rule','channel_rule') NOT NULL,
  `title` varchar(255) NOT NULL, `content` text NOT NULL, `sourceReference` varchar(1024),
  `confidenceScore` int NOT NULL DEFAULT 50, `active` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `brand_memory_items_id` PRIMARY KEY(`id`), INDEX `brand_memory_user_type_idx` (`userId`,`memoryType`)
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `agent_runs` (
  `id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL,
  `agentType` enum('strategist','researcher','copywriter','creative_director','designer','reviewer','compliance','publisher','analyst') NOT NULL,
  `entityType` varchar(80), `entityId` varchar(120), `inputSummary` text, `outputSummary` text,
  `status` enum('started','completed','failed','blocked_human') NOT NULL DEFAULT 'started', `durationMs` int, `errorMessage` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `completedAt` timestamp NULL,
  CONSTRAINT `agent_runs_id` PRIMARY KEY(`id`), INDEX `agent_runs_user_agent_idx` (`userId`,`agentType`)
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `compliance_checks` (
  `id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL, `postId` int, `adPlanId` int,
  `checkType` enum('legal_advertising','lgpd','copyright','source_integrity','platform_policy','brand_safety') NOT NULL,
  `result` enum('passed','warning','blocked','needs_human') NOT NULL, `findingsJson` text NOT NULL,
  `checkedBy` enum('system','human') NOT NULL DEFAULT 'system', `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `compliance_checks_id` PRIMARY KEY(`id`), INDEX `compliance_checks_user_result_idx` (`userId`,`result`)
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `generated_reports` (
  `id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL,
  `reportType` enum('weekly','monthly','campaign','executive') NOT NULL,
  `periodStart` timestamp NOT NULL, `periodEnd` timestamp NOT NULL, `summary` text NOT NULL,
  `metricsJson` text NOT NULL, `findingsJson` text NOT NULL, `recommendationsJson` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `generated_reports_id` PRIMARY KEY(`id`), INDEX `generated_reports_user_period_idx` (`userId`,`periodEnd`)
);
