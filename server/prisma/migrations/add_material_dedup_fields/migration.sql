-- 素材去重与使用追踪字段迁移
-- 添加 contentHash, fileHash, simHash, usagePlatforms, isDuplicate 字段

ALTER TABLE `Material` ADD COLUMN `contentHash` VARCHAR(191) NULL;
ALTER TABLE `Material` ADD COLUMN `fileHash` VARCHAR(191) NULL;
ALTER TABLE `Material` ADD COLUMN `simHash` VARCHAR(191) NULL;
ALTER TABLE `Material` ADD COLUMN `usagePlatforms` VARCHAR(191) NULL;
ALTER TABLE `Material` ADD COLUMN `isDuplicate` BOOLEAN NOT NULL DEFAULT false;

-- 添加索引
CREATE INDEX `Material_userId_type_idx` ON `Material`(`userId`, `type`);
CREATE INDEX `Material_contentHash_idx` ON `Material`(`contentHash`);
CREATE INDEX `Material_fileHash_idx` ON `Material`(`fileHash`);
CREATE INDEX `Material_simHash_idx` ON `Material`(`simHash`);
CREATE INDEX `Material_userId_isDuplicate_idx` ON `Material`(`userId`, `isDuplicate`);
