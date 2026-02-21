CREATE TABLE `activityLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(100) NOT NULL,
	`entityId` int,
	`changes` text,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `backgroundImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`imageUrl` varchar(1024) NOT NULL,
	`displayMode` enum('single','slideshow') NOT NULL DEFAULT 'single',
	`displayDuration` int DEFAULT 5000,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `backgroundImages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deviceStatus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` varchar(255) NOT NULL,
	`roomId` int,
	`roomNumber` varchar(50),
	`lastSyncTime` timestamp,
	`isOnline` boolean NOT NULL DEFAULT false,
	`currentVersion` varchar(50),
	`deviceInfo` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deviceStatus_id` PRIMARY KEY(`id`),
	CONSTRAINT `deviceStatus_deviceId_unique` UNIQUE(`deviceId`)
);
--> statement-breakpoint
CREATE TABLE `guestInformation` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`guestName` varchar(255) NOT NULL,
	`checkInDate` timestamp,
	`checkOutDate` timestamp,
	`wifiPassword` varchar(255),
	`wifiSsid` varchar(255),
	`welcomeMessage` text,
	`welcomeMessageEn` text,
	`additionalInfo` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guestInformation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `localizationSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`languageCode` varchar(10) NOT NULL,
	`languageName` varchar(100) NOT NULL,
	`isDefault` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `localizationSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `localizationSettings_languageCode_unique` UNIQUE(`languageCode`)
);
--> statement-breakpoint
CREATE TABLE `mediaFiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(1024) NOT NULL,
	`fileUrl` varchar(1024) NOT NULL,
	`fileType` varchar(50) NOT NULL,
	`mimeType` varchar(100),
	`fileSize` int,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mediaFiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menuItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameEn` varchar(255) NOT NULL,
	`icon` varchar(255),
	`iconUrl` varchar(1024),
	`category` varchar(100) NOT NULL,
	`contentType` varchar(50) NOT NULL,
	`contentValue` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menuItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomNumber` varchar(50) NOT NULL,
	`floor` int,
	`roomType` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rooms_id` PRIMARY KEY(`id`),
	CONSTRAINT `rooms_roomNumber_unique` UNIQUE(`roomNumber`)
);
--> statement-breakpoint
CREATE TABLE `systemConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configKey` varchar(255) NOT NULL,
	`configValue` text,
	`configType` varchar(50) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `systemConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `systemConfig_configKey_unique` UNIQUE(`configKey`)
);
--> statement-breakpoint
CREATE TABLE `tvChannels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameEn` varchar(255) NOT NULL,
	`description` text,
	`descriptionEn` text,
	`streamUrl` varchar(1024) NOT NULL,
	`thumbnailUrl` varchar(1024),
	`category` varchar(100) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tvChannels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','manager','staff') NOT NULL DEFAULT 'staff';--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;