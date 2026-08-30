CREATE TABLE `approval_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`postId` integer NOT NULL,
	`reviewerId` integer NOT NULL,
	`reviewerName` text,
	`decision` text NOT NULL,
	`notes` text,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `asset_library_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`sourcePath` text NOT NULL,
	`storageKey` text NOT NULL,
	`url` text NOT NULL,
	`fileName` text NOT NULL,
	`area` text NOT NULL,
	`title` text NOT NULL,
	`assetType` text NOT NULL,
	`groupKey` text,
	`slideOrder` integer,
	`mimeType` text NOT NULL,
	`byteSize` integer NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`tags` text,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `asset_library_source_unique` ON `asset_library_items` (`userId`,`sourcePath`);--> statement-breakpoint
CREATE INDEX `asset_library_user_area_idx` ON `asset_library_items` (`userId`,`area`);--> statement-breakpoint
CREATE INDEX `asset_library_group_order_idx` ON `asset_library_items` (`userId`,`groupKey`,`slideOrder`);--> statement-breakpoint
CREATE TABLE `automation_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`cadence` text DEFAULT 'weekdays' NOT NULL,
	`postsPerWeek` integer DEFAULT 5 NOT NULL,
	`defaultPublishTime` text DEFAULT '18:30' NOT NULL,
	`planningHorizonDays` integer DEFAULT 30 NOT NULL,
	`requireApproval` integer DEFAULT true NOT NULL,
	`allowSelfApproval` integer DEFAULT true NOT NULL,
	`refreshRadarDaily` integer DEFAULT true NOT NULL,
	`preferredAreas` text,
	`preferredFormats` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `automation_settings_user_unique` ON `automation_settings` (`userId`);--> statement-breakpoint
CREATE TABLE `brand_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`brandName` text NOT NULL,
	`segment` text NOT NULL,
	`location` text,
	`targetAudience` text,
	`commercialGoal` text,
	`toneOfVoice` text,
	`primaryCta` text,
	`prohibitedTerms` text,
	`operationMode` text DEFAULT 'manual' NOT NULL,
	`websiteUrl` text,
	`whatsapp` text,
	`visualGuidelines` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `brand_profiles_user_unique` ON `brand_profiles` (`userId`);--> statement-breakpoint
CREATE TABLE `content_media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`postId` integer NOT NULL,
	`storageKey` text,
	`url` text NOT NULL,
	`fileName` text,
	`mimeType` text,
	`byteSize` integer,
	`width` integer,
	`height` integer,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `content_media_post_order_idx` ON `content_media` (`postId`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `content_media_user_idx` ON `content_media` (`userId`);--> statement-breakpoint
CREATE TABLE `content_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`topicId` integer,
	`sourceId` integer,
	`area` text NOT NULL,
	`format` text NOT NULL,
	`audience` text NOT NULL,
	`strategicObjective` text,
	`contentPillar` text,
	`campaign` text,
	`funnelStage` text,
	`templateKey` text,
	`title` text NOT NULL,
	`hook` text,
	`caption` text,
	`cta` text,
	`hashtags` text,
	`altText` text,
	`keyStatement` text,
	`legalSource` text,
	`reviewDueAt` integer,
	`mediaUrl` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`approvalOwnerId` integer,
	`approvalOwnerName` text,
	`approvalNotes` text,
	`scheduledAt` integer,
	`publishedAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `content_sources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`title` text NOT NULL,
	`sourceType` text NOT NULL,
	`url` text,
	`notes` text,
	`verifiedAt` integer,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `editorial_topics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`area` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`audience` text NOT NULL,
	`priority` text NOT NULL,
	`suggestedFormat` text NOT NULL,
	`sourceUrl` text,
	`tags` text,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `hashtag_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`name` text NOT NULL,
	`area` text,
	`tags` text NOT NULL,
	`description` text,
	`usageCount` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `hashtag_groups_user_idx` ON `hashtag_groups` (`userId`);--> statement-breakpoint
CREATE TABLE `instagram_connections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`socialProfileId` integer,
	`instagramUserId` text,
	`username` text,
	`accessTokenCiphertext` text,
	`tokenExpiresAt` integer,
	`permissions` text,
	`state` text DEFAULT 'disconnected' NOT NULL,
	`lastError` text,
	`connectedAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `instagram_connections_user_unique` ON `instagram_connections` (`userId`);--> statement-breakpoint
CREATE INDEX `instagram_connections_profile_idx` ON `instagram_connections` (`socialProfileId`);--> statement-breakpoint
CREATE INDEX `instagram_connections_state_idx` ON `instagram_connections` (`state`);--> statement-breakpoint
CREATE TABLE `knowledge_materials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`title` text NOT NULL,
	`materialType` text NOT NULL,
	`url` text,
	`storageKey` text,
	`mimeType` text,
	`notes` text,
	`isVerified` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `publication_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`jobId` integer NOT NULL,
	`stage` text NOT NULL,
	`outcome` text NOT NULL,
	`externalReference` text,
	`errorCode` text,
	`detail` text,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `publication_attempts_job_idx` ON `publication_attempts` (`jobId`,`createdAt`);--> statement-breakpoint
CREATE TABLE `publication_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`postId` integer NOT NULL,
	`connectionId` integer,
	`status` text DEFAULT 'pending_confirmation' NOT NULL,
	`idempotencyKey` text NOT NULL,
	`frozenPayload` text NOT NULL,
	`confirmedAt` integer,
	`confirmedByUserId` integer,
	`scheduledAt` integer,
	`scheduleCronTaskUid` text,
	`testContainerId` text,
	`testedAt` integer,
	`containerId` text,
	`mediaId` text,
	`permalink` text,
	`attemptCount` integer DEFAULT 0 NOT NULL,
	`lastError` text,
	`publishedAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `publication_jobs_idempotency_unique` ON `publication_jobs` (`idempotencyKey`);--> statement-breakpoint
CREATE INDEX `publication_jobs_user_status_idx` ON `publication_jobs` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `publication_jobs_post_idx` ON `publication_jobs` (`postId`);--> statement-breakpoint
CREATE INDEX `publication_jobs_cron_task_idx` ON `publication_jobs` (`scheduleCronTaskUid`);--> statement-breakpoint
CREATE TABLE `social_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`network` text NOT NULL,
	`displayName` text NOT NULL,
	`handle` text,
	`profileUrl` text NOT NULL,
	`externalAccountId` text,
	`connectionMode` text DEFAULT 'manual' NOT NULL,
	`state` text DEFAULT 'active' NOT NULL,
	`notes` text,
	`verifiedAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `social_profiles_user_network_url_unique` ON `social_profiles` (`userId`,`network`,`profileUrl`);--> statement-breakpoint
CREATE INDEX `social_profiles_user_network_idx` ON `social_profiles` (`userId`,`network`);--> statement-breakpoint
CREATE INDEX `social_profiles_user_state_idx` ON `social_profiles` (`userId`,`state`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`lastSignedIn` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`actorUserId` integer,
	`entityType` text NOT NULL,
	`entityId` text,
	`action` text NOT NULL,
	`detailJson` text,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_events_user_created_idx` ON `audit_events` (`userId`,`createdAt`);--> statement-breakpoint
CREATE TABLE `automation_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`name` text NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`triggerType` text NOT NULL,
	`triggerConfigJson` text NOT NULL,
	`actionType` text NOT NULL,
	`actionConfigJson` text NOT NULL,
	`requiresHumanApproval` integer DEFAULT true NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `automation_rules_user_idx` ON `automation_rules` (`userId`,`enabled`);--> statement-breakpoint
CREATE TABLE `campaign_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`idempotencyKey` text NOT NULL,
	`name` text NOT NULL,
	`horizonDays` integer NOT NULL,
	`postsPerWeek` integer NOT NULL,
	`timezone` text DEFAULT 'America/Sao_Paulo' NOT NULL,
	`status` text DEFAULT 'planning' NOT NULL,
	`generatedCount` integer DEFAULT 0 NOT NULL,
	`errorMessage` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `campaign_runs_user_idempotency_unique` ON `campaign_runs` (`userId`,`idempotencyKey`);--> statement-breakpoint
CREATE INDEX `campaign_runs_user_idx` ON `campaign_runs` (`userId`,`createdAt`);--> statement-breakpoint
CREATE TABLE `competitors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`name` text NOT NULL,
	`websiteUrl` text,
	`instagramUrl` text,
	`linkedinUrl` text,
	`notes` text,
	`active` integer DEFAULT true NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `competitors_user_idx` ON `competitors` (`userId`,`active`);--> statement-breakpoint
CREATE TABLE `content_metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`postId` integer NOT NULL,
	`network` text NOT NULL,
	`impressions` integer DEFAULT 0 NOT NULL,
	`reach` integer DEFAULT 0 NOT NULL,
	`likes` integer DEFAULT 0 NOT NULL,
	`comments` integer DEFAULT 0 NOT NULL,
	`shares` integer DEFAULT 0 NOT NULL,
	`saves` integer DEFAULT 0 NOT NULL,
	`clicks` integer DEFAULT 0 NOT NULL,
	`leads` integer DEFAULT 0 NOT NULL,
	`capturedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `content_metrics_user_post_idx` ON `content_metrics` (`userId`,`postId`);--> statement-breakpoint
CREATE TABLE `content_opportunities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`sourceUrl` text,
	`sourceName` text,
	`title` text NOT NULL,
	`summary` text,
	`area` text,
	`locality` text,
	`relevanceScore` integer DEFAULT 0 NOT NULL,
	`freshnessScore` integer DEFAULT 0 NOT NULL,
	`authorityScore` integer DEFAULT 0 NOT NULL,
	`commercialScore` integer DEFAULT 0 NOT NULL,
	`riskScore` integer DEFAULT 0 NOT NULL,
	`totalScore` integer DEFAULT 0 NOT NULL,
	`rationale` text,
	`status` text DEFAULT 'new' NOT NULL,
	`detectedAt` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `content_opportunities_user_score_idx` ON `content_opportunities` (`userId`,`totalScore`);--> statement-breakpoint
CREATE INDEX `content_opportunities_user_status_idx` ON `content_opportunities` (`userId`,`status`);--> statement-breakpoint
CREATE TABLE `creative_evaluations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`postId` integer NOT NULL,
	`mediaUrl` text NOT NULL,
	`visualQuality` integer DEFAULT 0 NOT NULL,
	`brandFit` integer DEFAULT 0 NOT NULL,
	`legibility` integer DEFAULT 0 NOT NULL,
	`attentionPotential` integer DEFAULT 0 NOT NULL,
	`aiAppearanceRisk` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`passed` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `creative_evaluations_user_post_idx` ON `creative_evaluations` (`userId`,`postId`);--> statement-breakpoint
CREATE TABLE `leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`source` text NOT NULL,
	`sourceInteractionId` integer,
	`name` text,
	`contact` text,
	`interest` text,
	`notes` text,
	`status` text DEFAULT 'new' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `leads_user_status_idx` ON `leads` (`userId`,`status`);--> statement-breakpoint
CREATE TABLE `post_approval_bindings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`postId` integer NOT NULL,
	`versionId` integer NOT NULL,
	`contentHash` text NOT NULL,
	`approvedByUserId` integer NOT NULL,
	`approvedAt` integer NOT NULL,
	`invalidatedAt` integer,
	`invalidationReason` text
);
--> statement-breakpoint
CREATE INDEX `post_approval_bindings_post_idx` ON `post_approval_bindings` (`userId`,`postId`);--> statement-breakpoint
CREATE TABLE `post_versions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`postId` integer NOT NULL,
	`version` integer NOT NULL,
	`contentHash` text NOT NULL,
	`snapshotJson` text NOT NULL,
	`changeReason` text,
	`createdByUserId` integer NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `post_versions_post_version_unique` ON `post_versions` (`postId`,`version`);--> statement-breakpoint
CREATE INDEX `post_versions_user_post_idx` ON `post_versions` (`userId`,`postId`);--> statement-breakpoint
CREATE TABLE `social_interactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`socialProfileId` integer,
	`network` text NOT NULL,
	`externalId` text,
	`authorName` text,
	`authorHandle` text,
	`body` text NOT NULL,
	`kind` text DEFAULT 'question' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`aiSuggestedReply` text,
	`requiresHumanApproval` integer DEFAULT false NOT NULL,
	`receivedAt` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `social_interactions_user_status_idx` ON `social_interactions` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `social_interactions_user_kind_idx` ON `social_interactions` (`userId`,`kind`);--> statement-breakpoint
CREATE TABLE `ad_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`platform` text NOT NULL,
	`name` text NOT NULL,
	`objective` text NOT NULL,
	`audienceJson` text NOT NULL,
	`locationJson` text,
	`offer` text,
	`budgetCents` integer,
	`durationDays` integer,
	`conversionEvent` text,
	`maxAcceptableCostCents` integer,
	`successMetric` text,
	`creativeBriefJson` text,
	`landingPageUrl` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`requiresApproval` integer DEFAULT true NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ad_plans_user_status_idx` ON `ad_plans` (`userId`,`status`);--> statement-breakpoint
CREATE TABLE `agent_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`agentType` text NOT NULL,
	`entityType` text,
	`entityId` text,
	`inputSummary` text,
	`outputSummary` text,
	`status` text DEFAULT 'started' NOT NULL,
	`durationMs` integer,
	`errorMessage` text,
	`createdAt` integer NOT NULL,
	`completedAt` integer
);
--> statement-breakpoint
CREATE INDEX `agent_runs_user_agent_idx` ON `agent_runs` (`userId`,`agentType`);--> statement-breakpoint
CREATE TABLE `brand_memory_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`memoryType` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`sourceReference` text,
	`confidenceScore` integer DEFAULT 50 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `brand_memory_user_type_idx` ON `brand_memory_items` (`userId`,`memoryType`);--> statement-breakpoint
CREATE TABLE `compliance_checks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`postId` integer,
	`adPlanId` integer,
	`checkType` text NOT NULL,
	`result` text NOT NULL,
	`findingsJson` text NOT NULL,
	`checkedBy` text DEFAULT 'system' NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `compliance_checks_user_result_idx` ON `compliance_checks` (`userId`,`result`);--> statement-breakpoint
CREATE TABLE `generated_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`reportType` text NOT NULL,
	`periodStart` integer NOT NULL,
	`periodEnd` integer NOT NULL,
	`summary` text NOT NULL,
	`metricsJson` text NOT NULL,
	`findingsJson` text NOT NULL,
	`recommendationsJson` text NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `generated_reports_user_period_idx` ON `generated_reports` (`userId`,`periodEnd`);--> statement-breakpoint
CREATE TABLE `performance_insights` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`insightType` text NOT NULL,
	`title` text NOT NULL,
	`evidenceJson` text NOT NULL,
	`recommendation` text NOT NULL,
	`confidenceScore` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `performance_insights_user_active_idx` ON `performance_insights` (`userId`,`active`);--> statement-breakpoint
CREATE TABLE `seo_audits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`scope` text NOT NULL,
	`targetUrl` text,
	`location` text,
	`keyword` text,
	`score` integer DEFAULT 0 NOT NULL,
	`findingsJson` text NOT NULL,
	`recommendationsJson` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`auditedAt` integer NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `seo_audits_user_scope_idx` ON `seo_audits` (`userId`,`scope`);--> statement-breakpoint
CREATE TABLE `video_projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`postId` integer,
	`title` text NOT NULL,
	`platform` text NOT NULL,
	`durationSeconds` integer DEFAULT 30 NOT NULL,
	`hook` text,
	`script` text,
	`shotListJson` text,
	`onScreenTextJson` text,
	`thumbnailBrief` text,
	`recordingGuidance` text,
	`status` text DEFAULT 'brief' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `video_projects_user_status_idx` ON `video_projects` (`userId`,`status`);--> statement-breakpoint
CREATE TABLE `automation_executions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`ruleId` integer NOT NULL,
	`fingerprint` text NOT NULL,
	`entityType` text NOT NULL,
	`entityId` text NOT NULL,
	`triggerSnapshotJson` text NOT NULL,
	`actionSnapshotJson` text NOT NULL,
	`status` text DEFAULT 'pending_approval' NOT NULL,
	`requiresHumanApproval` integer DEFAULT true NOT NULL,
	`approvedByUserId` integer,
	`approvedAt` integer,
	`resultJson` text,
	`errorMessage` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `automation_executions_fingerprint_unique` ON `automation_executions` (`userId`,`fingerprint`);--> statement-breakpoint
CREATE INDEX `automation_executions_user_status_idx` ON `automation_executions` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `automation_executions_rule_idx` ON `automation_executions` (`userId`,`ruleId`);--> statement-breakpoint
CREATE TABLE `autonomy_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`level` text DEFAULT 'assisted' NOT NULL,
	`allowAutoResearch` integer DEFAULT true NOT NULL,
	`allowAutoDraft` integer DEFAULT false NOT NULL,
	`allowAutoSchedule` integer DEFAULT false NOT NULL,
	`requireHumanForLegalContent` integer DEFAULT true NOT NULL,
	`requireHumanForExternalPublish` integer DEFAULT true NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `autonomy_profiles_user_unique` ON `autonomy_profiles` (`userId`);