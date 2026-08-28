ALTER TABLE `instagram_connections` ADD `socialProfileId` int;--> statement-breakpoint
CREATE INDEX `instagram_connections_profile_idx` ON `instagram_connections` (`socialProfileId`);