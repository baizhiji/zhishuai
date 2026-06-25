-- ============================================================
-- 智枢 AI SaaS - 数据库增量迁移脚本
-- 日期：2026-06-23
-- 用途：添加 LoginLog 表 + ScheduledTask 新字段
-- 执行方式：mysql -u root -p -h 172.19.0.13 zhishuai < this_file.sql
-- ============================================================

-- 1. 创建 LoginLog 表（如果不存在）
CREATE TABLE IF NOT EXISTS `LoginLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `ip` VARCHAR(191) NULL,
    `device` VARCHAR(191) NULL,
    `deviceId` VARCHAR(191) NULL,
    `deviceName` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `loginAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NOT NULL DEFAULT 'success',
    `token` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (`id`),
    INDEX `LoginLog_userId_idx`(`userId`),
    INDEX `LoginLog_deviceId_idx`(`deviceId`),
    INDEX `LoginLog_isActive_idx`(`isActive`),
    INDEX `LoginLog_loginAt_idx`(`loginAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. 添加外键（如果不存在）
ALTER TABLE `LoginLog` ADD CONSTRAINT `LoginLog_userId_fkey` 
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. ScheduledTask 新增 materialId 字段
ALTER TABLE `ScheduledTask` ADD COLUMN `materialId` VARCHAR(191) NULL;

-- 4. ScheduledTask 新增 publishRecordId 字段
ALTER TABLE `ScheduledTask` ADD COLUMN `publishRecordId` VARCHAR(191) NULL;

-- 完成！
SELECT 'Migration completed: LoginLog table + ScheduledTask new fields' AS result;
