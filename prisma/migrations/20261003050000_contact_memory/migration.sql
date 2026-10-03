-- CreateTable
CREATE TABLE `WppContactMemory` (
    `id` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(40) NOT NULL,
    `name` VARCHAR(80) NULL,
    `ramo` VARCHAR(80) NULL,
    `topics` TEXT NULL,
    `visits` INTEGER NOT NULL DEFAULT 1,
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `WppContactMemory_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

