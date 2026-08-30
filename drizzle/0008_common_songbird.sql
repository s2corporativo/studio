CREATE TABLE `asset_library_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sourcePath` varchar(1024) NOT NULL,
	`storageKey` varchar(1024) NOT NULL,
	`url` varchar(2048) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`area` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`assetType` enum('single','carousel_slide') NOT NULL,
	`groupKey` varchar(160),
	`slideOrder` int,
	`mimeType` varchar(120) NOT NULL,
	`byteSize` int NOT NULL,
	`width` int NOT NULL,
	`height` int NOT NULL,
	`tags` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `asset_library_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_library_source_unique` UNIQUE(`userId`,`sourcePath`)
);
--> statement-breakpoint
CREATE INDEX `asset_library_user_area_idx` ON `asset_library_items` (`userId`,`area`);--> statement-breakpoint
CREATE INDEX `asset_library_group_order_idx` ON `asset_library_items` (`userId`,`groupKey`,`slideOrder`);