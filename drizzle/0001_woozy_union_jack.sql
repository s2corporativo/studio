CREATE TABLE `approval_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`reviewerId` int NOT NULL,
	`reviewerName` varchar(180),
	`decision` enum('approved','rejected','changes_requested') NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approval_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brand_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`brandName` varchar(180) NOT NULL,
	`segment` varchar(180) NOT NULL,
	`location` varchar(180),
	`targetAudience` text,
	`commercialGoal` text,
	`toneOfVoice` text,
	`primaryCta` text,
	`prohibitedTerms` text,
	`websiteUrl` varchar(1024),
	`whatsapp` varchar(80),
	`visualGuidelines` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brand_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`topicId` int,
	`area` varchar(80) NOT NULL,
	`format` enum('post','carousel','reel','story') NOT NULL,
	`audience` varchar(180) NOT NULL,
	`title` varchar(255) NOT NULL,
	`hook` text,
	`caption` text,
	`cta` text,
	`hashtags` text,
	`altText` text,
	`legalSource` text,
	`reviewDueAt` timestamp,
	`mediaUrl` varchar(2048),
	`status` enum('draft','review','approved','scheduled','published','rejected') NOT NULL DEFAULT 'draft',
	`approvalOwnerId` int,
	`approvalOwnerName` varchar(180),
	`approvalNotes` text,
	`scheduledAt` timestamp,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`sourceType` varchar(40) NOT NULL,
	`url` varchar(1024),
	`notes` text,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `editorial_topics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`area` varchar(80) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`audience` varchar(180) NOT NULL,
	`priority` varchar(20) NOT NULL,
	`suggestedFormat` enum('post','carousel','reel','story') NOT NULL,
	`sourceUrl` varchar(1024),
	`tags` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `editorial_topics_id` PRIMARY KEY(`id`)
);
