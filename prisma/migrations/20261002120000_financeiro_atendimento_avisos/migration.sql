-- AlterTable
ALTER TABLE `Client` ADD COLUMN `lastPaidAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Payable` ADD COLUMN `finePercent` DOUBLE NULL,
    ADD COLUMN `installments` INTEGER NULL,
    ADD COLUMN `interestPeriod` VARCHAR(191) NULL,
    ADD COLUMN `interestRate` DOUBLE NULL,
    ADD COLUMN `parentId` VARCHAR(191) NULL,
    ADD COLUMN `recurrence` VARCHAR(191) NOT NULL DEFAULT 'none',
    ADD COLUMN `recurrenceCount` INTEGER NULL;

-- AlterTable
ALTER TABLE `WppBotConfig` ADD COLUMN `useButtons` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `WppConversation` ADD COLUMN `acceptedAt` DATETIME(3) NULL,
    ADD COLUMN `attendantId` VARCHAR(36) NULL,
    ADD COLUMN `attendantPhone` VARCHAR(30) NULL,
    ADD COLUMN `queuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `ClientPayment` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `dueDate` DATETIME(3) NULL,
    `paidAt` DATETIME(3) NOT NULL,
    `method` VARCHAR(40) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ClientPayment_clientId_idx`(`clientId`),
    INDEX `ClientPayment_paidAt_idx`(`paidAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClientBillingNotice` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(20) NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ClientBillingNotice_clientId_kind_dueDate_key`(`clientId`, `kind`, `dueDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PayablePayment` (
    `id` VARCHAR(191) NOT NULL,
    `payableId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `method` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamRecipient` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(36) NULL,
    `notifyPayables` BOOLEAN NOT NULL DEFAULT true,
    `notifyReceivables` BOOLEAN NOT NULL DEFAULT true,
    `notifyMeetings` BOOLEAN NOT NULL DEFAULT true,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Meeting` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `location` VARCHAR(255) NULL,
    `notes` TEXT NULL,
    `createdById` VARCHAR(191) NULL,
    `createdByName` VARCHAR(191) NULL,
    `reminderSentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Meeting_startsAt_idx`(`startsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MeetingAttendee` (
    `id` VARCHAR(191) NOT NULL,
    `meetingId` VARCHAR(191) NOT NULL,
    `recipientId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `MeetingAttendee_meetingId_recipientId_key`(`meetingId`, `recipientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamNoticeLog` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(120) NOT NULL,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `TeamNoticeLog_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Receivable` (
    `id` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `receivedAt` DATETIME(3) NULL,
    `receivedAmount` DOUBLE NULL,
    `method` VARCHAR(40) NULL,
    `notes` TEXT NULL,
    `clientId` VARCHAR(36) NULL,
    `payerName` VARCHAR(191) NULL,
    `groupId` VARCHAR(36) NULL,
    `installmentNo` INTEGER NULL,
    `installmentsTotal` INTEGER NULL,
    `createdById` VARCHAR(191) NULL,
    `createdByName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Receivable_dueDate_idx`(`dueDate`),
    INDEX `Receivable_groupId_idx`(`groupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Client_saleId_key` ON `Client`(`saleId`);

-- AddForeignKey
ALTER TABLE `Client` ADD CONSTRAINT `Client_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `Sale`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientPayment` ADD CONSTRAINT `ClientPayment_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientBillingNotice` ADD CONSTRAINT `ClientBillingNotice_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payable` ADD CONSTRAINT `Payable_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Payable`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayablePayment` ADD CONSTRAINT `PayablePayment_payableId_fkey` FOREIGN KEY (`payableId`) REFERENCES `Payable`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MeetingAttendee` ADD CONSTRAINT `MeetingAttendee_meetingId_fkey` FOREIGN KEY (`meetingId`) REFERENCES `Meeting`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MeetingAttendee` ADD CONSTRAINT `MeetingAttendee_recipientId_fkey` FOREIGN KEY (`recipientId`) REFERENCES `TeamRecipient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Receivable` ADD CONSTRAINT `Receivable_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

