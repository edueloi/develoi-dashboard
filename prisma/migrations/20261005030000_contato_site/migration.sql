-- AlterTable
ALTER TABLE `TeamRecipient` ADD COLUMN `notifyContact` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `ContactMessage` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(200) NULL,
    `phone` VARCHAR(40) NULL,
    `service` VARCHAR(120) NULL,
    `message` TEXT NOT NULL,
    `notified` BOOLEAN NOT NULL DEFAULT false,
    `handled` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ContactMessage_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

