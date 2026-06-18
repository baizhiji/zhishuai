-- CreateTable
CREATE TABLE `MapFavorite` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `poiId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `location` JSON NULL,
    `type` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MapFavorite_userId_idx`(`userId`),
    INDEX `MapFavorite_poiId_idx`(`poiId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LiveRoom` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL DEFAULT 'douyin',
    `roomId` VARCHAR(191) NOT NULL,
    `roomName` VARCHAR(191) NOT NULL,
    `hostName` VARCHAR(191) NULL,
    `link` VARCHAR(191) NULL,
    `coverUrl` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'offline',
    `viewerCount` INTEGER NOT NULL DEFAULT 0,
    `likeCount` INTEGER NOT NULL DEFAULT 0,
    `giftCount` INTEGER NOT NULL DEFAULT 0,
    `followerCount` INTEGER NOT NULL DEFAULT 0,
    `salesAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `productCount` INTEGER NOT NULL DEFAULT 0,
    `startTime` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LiveRoom_userId_platform_idx`(`userId`, `platform`),
    INDEX `LiveRoom_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `agentId` VARCHAR(191) NULL,
    `planId` VARCHAR(191) NULL,
    `amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `paymentMethod` VARCHAR(191) NULL,
    `transactionId` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Order_userId_status_idx`(`userId`, `status`),
    INDEX `Order_agentId_status_idx`(`agentId`, `status`),
    INDEX `Order_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Settlement` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `bankAccount` VARCHAR(191) NULL,
    `bankName` VARCHAR(191) NULL,
    `remark` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewedBy` VARCHAR(191) NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Settlement_agentId_status_idx`(`agentId`, `status`),
    INDEX `Settlement_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MapFavorite` ADD CONSTRAINT `MapFavorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LiveRoom` ADD CONSTRAINT `LiveRoom_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Settlement` ADD CONSTRAINT `Settlement_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
