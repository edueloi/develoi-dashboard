-- CreateTable
CREATE TABLE `FeatureComment` (
    `id` VARCHAR(191) NOT NULL,
    `featureId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'comment',
    `authorId` VARCHAR(191) NULL,
    `authorName` VARCHAR(191) NULL,
    `text` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FeatureComment_featureId_idx`(`featureId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FeatureComment` ADD CONSTRAINT `FeatureComment_featureId_fkey` FOREIGN KEY (`featureId`) REFERENCES `Feature`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

