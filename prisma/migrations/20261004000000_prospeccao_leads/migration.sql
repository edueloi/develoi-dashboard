-- CreateTable
CREATE TABLE `Lead` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `company` VARCHAR(150) NULL,
    `phone` VARCHAR(40) NULL,
    `email` VARCHAR(150) NULL,
    `city` VARCHAR(100) NULL,
    `source` VARCHAR(40) NOT NULL DEFAULT 'manual',
    `product` VARCHAR(120) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'new',
    `value` DOUBLE NOT NULL DEFAULT 0,
    `nextFollowUp` DATETIME(3) NULL,
    `lastContactAt` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `lostReason` VARCHAR(200) NULL,
    `clientId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Lead_status_idx`(`status`),
    INDEX `Lead_nextFollowUp_idx`(`nextFollowUp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeadActivity` (
    `id` VARCHAR(191) NOT NULL,
    `leadId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(20) NOT NULL DEFAULT 'note',
    `text` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LeadActivity_leadId_idx`(`leadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LeadActivity` ADD CONSTRAINT `LeadActivity_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

