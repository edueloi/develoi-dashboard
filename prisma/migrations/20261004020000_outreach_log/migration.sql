-- CreateTable
CREATE TABLE `OutreachLog` (
    `id` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `name` VARCHAR(150) NULL,
    `source` VARCHAR(20) NOT NULL DEFAULT 'other',
    `refId` VARCHAR(64) NULL,
    `via` VARCHAR(20) NOT NULL DEFAULT 'bot',
    `message` TEXT NOT NULL,
    `byName` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OutreachLog_phone_idx`(`phone`),
    INDEX `OutreachLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

