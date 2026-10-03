-- CreateTable
CREATE TABLE `WppBotKnowledge` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `system` VARCHAR(80) NULL,
    `phrases` TEXT NOT NULL,
    `keywords` TEXT NULL,
    `answer` TEXT NOT NULL,
    `action` VARCHAR(40) NOT NULL DEFAULT 'reply',
    `followUp` TEXT NULL,
    `priority` INTEGER NOT NULL DEFAULT 5,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `hits` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WppBotNluLog` (
    `id` VARCHAR(191) NOT NULL,
    `text` VARCHAR(500) NOT NULL,
    `intentId` VARCHAR(80) NULL,
    `confidence` DOUBLE NOT NULL DEFAULT 0,
    `outcome` VARCHAR(10) NOT NULL,
    `dismissed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WppBotNluLog_outcome_dismissed_createdAt_idx`(`outcome`, `dismissed`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

