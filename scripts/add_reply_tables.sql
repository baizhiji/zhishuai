CREATE TABLE IF NOT EXISTS `ReplyRule` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `keyword` VARCHAR(255) NOT NULL,
  `matchType` VARCHAR(50) NOT NULL DEFAULT 'exact',
  `replyContent` TEXT NOT NULL,
  `platform` VARCHAR(50) NOT NULL DEFAULT 'all',
  `replyType` VARCHAR(50) NOT NULL DEFAULT 'text',
  `status` TINYINT(1) NOT NULL DEFAULT 1,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `weeklyCount` INT NOT NULL DEFAULT 0,
  `monthlyCount` INT NOT NULL DEFAULT 0,
  `totalCount` INT NOT NULL DEFAULT 0,
  `lastMatched` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_reply_rule_user_status` (`userId`, `status`),
  INDEX `idx_reply_rule_user_platform` (`userId`, `platform`),
  INDEX `idx_reply_rule_keyword` (`keyword`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ReplyLog` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `ruleId` VARCHAR(36) NULL,
  `keyword` VARCHAR(255) NOT NULL,
  `matchType` VARCHAR(50) NOT NULL,
  `replyContent` TEXT NOT NULL,
  `platform` VARCHAR(50) NOT NULL,
  `sourceMessage` TEXT NULL,
  `senderName` VARCHAR(255) NULL,
  `success` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_reply_log_user` (`userId`, `createdAt`),
  INDEX `idx_reply_log_rule` (`ruleId`),
  CONSTRAINT `fk_reply_log_rule` FOREIGN KEY (`ruleId`) REFERENCES `ReplyRule`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
