CREATE DATABASE IF NOT EXISTS `hotel_spin`;
USE `hotel_spin`;

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS `admins` (
  `email` VARCHAR(255) PRIMARY KEY,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) DEFAULT 'admin',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Rewards Table
CREATE TABLE IF NOT EXISTS `rewards` (
  `id` VARCHAR(100) PRIMARY KEY,
  `rewardName` VARCHAR(255) NOT NULL,
  `probability` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `usageLimit` INT NOT NULL DEFAULT 0,
  `usedCount` INT NOT NULL DEFAULT 0,
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `validityDays` INT NOT NULL DEFAULT 7,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Spins & Coupons Table
CREATE TABLE IF NOT EXISTS `spins` (
  `id` VARCHAR(100) PRIMARY KEY,
  `customerName` VARCHAR(255) NOT NULL,
  `mobile` VARCHAR(50) NOT NULL,
  `instagramUsername` VARCHAR(255) DEFAULT '',
  `instagramUsernameNormalized` VARCHAR(255) DEFAULT '',
  `email` VARCHAR(255) DEFAULT '',
  `followConfirmed` BOOLEAN DEFAULT TRUE,
  `rewardId` VARCHAR(100) NOT NULL,
  `rewardName` VARCHAR(255) NOT NULL,
  `couponCode` VARCHAR(50) UNIQUE NOT NULL,
  `status` VARCHAR(50) DEFAULT 'unused',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expiresAt` TIMESTAMP NULL,
  `usedAt` TIMESTAMP NULL,
  `usedBy` VARCHAR(255) NULL,
  FOREIGN KEY (`rewardId`) REFERENCES `rewards`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Settings Table
CREATE TABLE IF NOT EXISTS `settings` (
  `key_name` VARCHAR(100) PRIMARY KEY,
  `campaignActive` BOOLEAN DEFAULT TRUE,
  `spinStartDate` TIMESTAMP NULL,
  `spinEndDate` TIMESTAMP NULL,
  `spinEligibility` VARCHAR(100) DEFAULT 'one_per_mobile'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --- SEED SECTIONS ---
-- Seed default administrator
INSERT INTO `admins` (`email`, `password_hash`, `role`) VALUES 
('admin@spin.com', 'admin123', 'admin') 
ON DUPLICATE KEY UPDATE `email`=`email`;

-- Seed default rewards matching the segments of the wheel
INSERT INTO `rewards` (`id`, `rewardName`, `probability`, `usageLimit`, `usedCount`, `active`, `validityDays`) VALUES
('reward_1', 'FREE Welcome Drink', 20.00, 1000, 0, TRUE, 7),
('reward_2', '15% OFF Dining Bill', 25.00, 500, 0, TRUE, 7),
('reward_3', 'FREE Starter Item', 20.00, 300, 0, TRUE, 7),
('reward_4', 'Dessert of Choice', 15.00, 200, 0, TRUE, 7),
('reward_5', 'Buy 1 Get 1 Coffee', 10.00, 400, 0, TRUE, 7),
('reward_6', 'FREE Chef Special', 10.00, 100, 0, TRUE, 7)
ON DUPLICATE KEY UPDATE `rewardName`=VALUES(`rewardName`);

-- Seed default settings
INSERT INTO `settings` (`key_name`, `campaignActive`, `spinStartDate`, `spinEndDate`, `spinEligibility`) VALUES
('campaign', TRUE, NULL, NULL, 'one_per_mobile')
ON DUPLICATE KEY UPDATE `campaignActive`=VALUES(`campaignActive`);
