ALTER TABLE `brand_profiles` ADD `operationMode` enum('manual','semi_automatic') DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `content_posts` ADD `sourceId` int;--> statement-breakpoint
ALTER TABLE `content_posts` ADD `keyStatement` text;