-- Links e documentos para Contas a Pagar e Contas a Receber.
CREATE TABLE `FinancialDocument` (
    `id` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(120) NOT NULL,
    `size` INTEGER NOT NULL,
    `data` LONGBLOB NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `FinancialAttachment` (
    `id` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(10) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `url` TEXT NULL,
    `documentId` VARCHAR(191) NULL,
    `payableId` VARCHAR(191) NULL,
    `receivableId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FinancialAttachment_payableId_idx`(`payableId`),
    INDEX `FinancialAttachment_receivableId_idx`(`receivableId`),
    INDEX `FinancialAttachment_documentId_idx`(`documentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `FinancialAttachment` ADD CONSTRAINT `FinancialAttachment_documentId_fkey`
  FOREIGN KEY (`documentId`) REFERENCES `FinancialDocument`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `FinancialAttachment` ADD CONSTRAINT `FinancialAttachment_payableId_fkey`
  FOREIGN KEY (`payableId`) REFERENCES `Payable`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `FinancialAttachment` ADD CONSTRAINT `FinancialAttachment_receivableId_fkey`
  FOREIGN KEY (`receivableId`) REFERENCES `Receivable`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
