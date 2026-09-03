CREATE TABLE `knowledge_materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`materialType` varchar(60) NOT NULL,
	`url` varchar(1024),
	`notes` text,
	`isVerified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `knowledge_materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `content_posts` ADD `contentPillar` varchar(80);--> statement-breakpoint
ALTER TABLE `content_posts` ADD `campaign` varchar(180);--> statement-breakpoint
ALTER TABLE `content_posts` ADD `funnelStage` enum('discovery','consideration','conversion','relationship');--> statement-breakpoint
ALTER TABLE `content_posts` ADD `templateKey` varchar(60);