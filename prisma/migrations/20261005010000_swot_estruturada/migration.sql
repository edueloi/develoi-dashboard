-- CreateTable
CREATE TABLE `SwotItem` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(15) NOT NULL,
    `title` VARCHAR(300) NOT NULL,
    `note` TEXT NULL,
    `impact` INTEGER NULL,
    `urgency` INTEGER NULL,
    `control` INTEGER NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `updatedByName` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SwotItem_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SwotRating` (
    `id` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `impact` INTEGER NULL,
    `urgency` INTEGER NULL,
    `control` INTEGER NULL,
    `note` TEXT NULL,
    `ratedByName` VARCHAR(100) NULL,
    `ratedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SwotRating_itemId_idx`(`itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SwotRating` ADD CONSTRAINT `SwotRating_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `SwotItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

