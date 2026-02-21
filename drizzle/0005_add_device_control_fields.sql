ALTER TABLE `deviceStatus` ADD COLUMN `deviceName` varchar(255);
ALTER TABLE `deviceStatus` ADD COLUMN `isPoweredOn` boolean DEFAULT true NOT NULL;
ALTER TABLE `deviceStatus` ADD COLUMN `volume` int DEFAULT 50 NOT NULL;
ALTER TABLE `deviceStatus` ADD COLUMN `isMuted` boolean DEFAULT false NOT NULL;
ALTER TABLE `deviceStatus` ADD COLUMN `lastCommand` varchar(50);
ALTER TABLE `deviceStatus` ADD COLUMN `lastCommandTime` timestamp;
