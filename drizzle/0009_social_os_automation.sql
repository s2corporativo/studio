ALTER TABLE `brand_profiles`
  ADD CONSTRAINT `brand_profiles_user_unique` UNIQUE (`userId`);

CREATE TABLE `automation_settings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `enabled` boolean NOT NULL DEFAULT false,
  `cadence` enum('daily','weekdays','custom') NOT NULL DEFAULT 'weekdays',
  `postsPerWeek` int NOT NULL DEFAULT 5,
  `defaultPublishTime` varchar(5) NOT NULL DEFAULT '18:30',
  `planningHorizonDays` int NOT NULL DEFAULT 30,
  `requireApproval` boolean NOT NULL DEFAULT true,
  `refreshRadarDaily` boolean NOT NULL DEFAULT true,
  `preferredAreas` text,
  `preferredFormats` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `automation_settings_id` PRIMARY KEY(`id`),
  CONSTRAINT `automation_settings_user_unique` UNIQUE(`userId`)
);
