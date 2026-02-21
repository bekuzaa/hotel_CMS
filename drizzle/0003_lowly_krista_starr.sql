CREATE TABLE `hotelSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hotelId` int NOT NULL,
	`packageId` int NOT NULL,
	`startDate` timestamp NOT NULL,
	`expiryDate` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`autoRenew` boolean NOT NULL DEFAULT false,
	`renewalDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hotelSubscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `hotelSubscriptions_hotelId_unique` UNIQUE(`hotelId`)
);
--> statement-breakpoint
CREATE TABLE `subscriptionPackages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`packageName` varchar(255) NOT NULL,
	`packageCode` varchar(50) NOT NULL,
	`durationDays` int,
	`price` int,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptionPackages_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptionPackages_packageCode_unique` UNIQUE(`packageCode`)
);
