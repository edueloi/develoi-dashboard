-- AlterTable
ALTER TABLE `Client` ADD COLUMN `asaasBillingType` VARCHAR(20) NULL,
    ADD COLUMN `asaasCustomerId` VARCHAR(40) NULL,
    ADD COLUMN `asaasSubscriptionId` VARCHAR(40) NULL;

-- AlterTable
ALTER TABLE `ClientPayment` ADD COLUMN `asaasPaymentId` VARCHAR(40) NULL;

-- CreateTable
CREATE TABLE `AsaasCharge` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `asaasPaymentId` VARCHAR(40) NOT NULL,
    `value` DOUBLE NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `status` VARCHAR(30) NOT NULL,
    `billingType` VARCHAR(20) NULL,
    `invoiceUrl` TEXT NULL,
    `bankSlipUrl` TEXT NULL,
    `receiptUrl` TEXT NULL,
    `paidAt` DATETIME(3) NULL,
    `linkSentAt` DATETIME(3) NULL,
    `receiptSentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AsaasCharge_asaasPaymentId_key`(`asaasPaymentId`),
    INDEX `AsaasCharge_clientId_idx`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `ClientPayment_asaasPaymentId_key` ON `ClientPayment`(`asaasPaymentId`);

-- AddForeignKey
ALTER TABLE `AsaasCharge` ADD CONSTRAINT `AsaasCharge_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

