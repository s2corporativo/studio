CREATE TABLE `content_media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`postId` int NOT NULL,
	`storageKey` varchar(1024),
	`url` varchar(2048) NOT NULL,
	`fileName` varchar(255),
	`mimeType` varchar(120),
	`byteSize` int,
	`width` int,
	`height` int,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `content_media_post_order_idx` ON `content_media` (`postId`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `content_media_user_idx` ON `content_media` (`userId`);