ALTER TABLE `users` ADD COLUMN `username` varchar(64);
ALTER TABLE `users` ADD COLUMN `passwordHash` varchar(255);
ALTER TABLE `users` MODIFY `openId` varchar(64);
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);
