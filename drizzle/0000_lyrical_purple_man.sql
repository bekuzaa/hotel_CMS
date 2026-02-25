CREATE TABLE `activityLogs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hotelId` integer,
	`userId` integer NOT NULL,
	`action` text NOT NULL,
	`entityType` text NOT NULL,
	`entityId` integer,
	`changes` text,
	`ipAddress` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `backgroundImages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hotelId` integer NOT NULL,
	`name` text NOT NULL,
	`imageUrl` text NOT NULL,
	`displayMode` text DEFAULT 'single' NOT NULL,
	`displayDuration` integer DEFAULT 5000,
	`displayOrder` integer DEFAULT 0 NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `deviceStatus` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hotelId` integer,
	`deviceId` text NOT NULL,
	`deviceName` text,
	`roomId` integer,
	`roomNumber` text,
	`pairingCode` text,
	`isPaired` integer DEFAULT false NOT NULL,
	`pairedAt` integer,
	`lastSyncTime` integer,
	`isOnline` integer DEFAULT false NOT NULL,
	`isPoweredOn` integer DEFAULT true NOT NULL,
	`volume` integer DEFAULT 50 NOT NULL,
	`isMuted` integer DEFAULT false NOT NULL,
	`currentChannel` text,
	`currentApp` text,
	`currentVersion` text,
	`deviceInfo` text,
	`lastCommand` text,
	`lastCommandTime` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `guestInformation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hotelId` integer NOT NULL,
	`roomId` integer NOT NULL,
	`guestName` text NOT NULL,
	`checkInDate` integer,
	`checkOutDate` integer,
	`wifiPassword` text,
	`wifiSsid` text,
	`welcomeMessage` text,
	`welcomeMessageEn` text,
	`additionalInfo` text,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `hotelSubscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hotelId` integer NOT NULL,
	`packageId` integer NOT NULL,
	`startDate` integer NOT NULL,
	`expiryDate` integer,
	`isActive` integer DEFAULT true NOT NULL,
	`autoRenew` integer DEFAULT false NOT NULL,
	`renewalDate` integer,
	`lastReminderSent` integer,
	`notes` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hotelSubscriptions_hotelId_unique` ON `hotelSubscriptions` (`hotelId`);--> statement-breakpoint
CREATE TABLE `hotels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hotelName` text NOT NULL,
	`hotelCode` text NOT NULL,
	`address` text,
	`city` text,
	`country` text,
	`phone` text,
	`email` text,
	`wifiSSID` text,
	`wifiPassword` text,
	`supportPhone` text,
	`supportEmail` text,
	`totalRooms` integer DEFAULT 0 NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hotels_hotelCode_unique` ON `hotels` (`hotelCode`);--> statement-breakpoint
CREATE TABLE `localizationSettings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`languageCode` text NOT NULL,
	`languageName` text NOT NULL,
	`isDefault` integer DEFAULT false NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `localizationSettings_languageCode_unique` ON `localizationSettings` (`languageCode`);--> statement-breakpoint
CREATE TABLE `mediaFiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hotelId` integer NOT NULL,
	`fileName` text NOT NULL,
	`fileKey` text NOT NULL,
	`fileUrl` text NOT NULL,
	`fileType` text NOT NULL,
	`mimeType` text,
	`fileSize` integer,
	`uploadedBy` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `menuItems` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hotelId` integer NOT NULL,
	`name` text NOT NULL,
	`nameEn` text NOT NULL,
	`icon` text,
	`iconUrl` text,
	`category` text NOT NULL,
	`contentType` text NOT NULL,
	`contentValue` text,
	`isActive` integer DEFAULT true NOT NULL,
	`displayOrder` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hotelId` integer NOT NULL,
	`roomNumber` text NOT NULL,
	`floor` integer,
	`roomType` text,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscriptionPackages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`packageName` text NOT NULL,
	`packageCode` text NOT NULL,
	`durationDays` integer,
	`price` integer,
	`description` text,
	`isActive` integer DEFAULT true NOT NULL,
	`displayOrder` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptionPackages_packageCode_unique` ON `subscriptionPackages` (`packageCode`);--> statement-breakpoint
CREATE TABLE `systemConfig` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hotelId` integer,
	`configKey` text NOT NULL,
	`configValue` text,
	`configType` text NOT NULL,
	`description` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tvApps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hotelId` integer NOT NULL,
	`appName` text NOT NULL,
	`appType` text NOT NULL,
	`packageName` text,
	`deepLink` text,
	`iconUrl` text,
	`iconName` text,
	`displayOrder` integer DEFAULT 0 NOT NULL,
	`isVisible` integer DEFAULT true NOT NULL,
	`isDefault` integer DEFAULT false NOT NULL,
	`customLabel` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tvChannels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hotelId` integer NOT NULL,
	`name` text NOT NULL,
	`nameEn` text NOT NULL,
	`description` text,
	`descriptionEn` text,
	`streamUrl` text NOT NULL,
	`thumbnailUrl` text,
	`category` text NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`displayOrder` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text,
	`username` text,
	`passwordHash` text,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'staff' NOT NULL,
	`hotelId` integer,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`lastSignedIn` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);