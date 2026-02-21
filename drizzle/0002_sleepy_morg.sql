CREATE TABLE `hotels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hotelName` varchar(255) NOT NULL,
	`hotelCode` varchar(50) NOT NULL,
	`address` text,
	`city` varchar(100),
	`country` varchar(100),
	`phone` varchar(20),
	`email` varchar(320),
	`wifiSSID` varchar(255),
	`wifiPassword` varchar(255),
	`supportPhone` varchar(20),
	`supportEmail` varchar(320),
	`totalRooms` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hotels_id` PRIMARY KEY(`id`),
	CONSTRAINT `hotels_hotelCode_unique` UNIQUE(`hotelCode`)
);
--> statement-breakpoint
ALTER TABLE `deviceStatus` DROP INDEX `deviceStatus_deviceId_unique`;--> statement-breakpoint
ALTER TABLE `rooms` DROP INDEX `rooms_roomNumber_unique`;--> statement-breakpoint
ALTER TABLE `systemConfig` DROP INDEX `systemConfig_configKey_unique`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','manager','staff','superAdmin','hotelAdmin') NOT NULL DEFAULT 'staff';--> statement-breakpoint
ALTER TABLE `activityLogs` ADD `hotelId` int;--> statement-breakpoint
ALTER TABLE `backgroundImages` ADD `hotelId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `deviceStatus` ADD `hotelId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `guestInformation` ADD `hotelId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `mediaFiles` ADD `hotelId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `menuItems` ADD `hotelId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `rooms` ADD `hotelId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `systemConfig` ADD `hotelId` int;--> statement-breakpoint
ALTER TABLE `tvChannels` ADD `hotelId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `hotelId` int;