-- CreateTable
CREATE TABLE `AsaasWebhookLog` (
    `id` VARCHAR(191) NOT NULL,
    `event` VARCHAR(60) NOT NULL,
    `asaasPaymentId` VARCHAR(40) NULL,
    `clientName` VARCHAR(191) NULL,
    `outcome` VARCHAR(160) NOT NULL,
    `ok` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AsaasWebhookLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

