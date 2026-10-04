-- AlterTable
ALTER TABLE `ProfitConfig` ADD COLUMN `reimbursementPolicy` VARCHAR(12) NOT NULL DEFAULT 'debt_first';

-- AlterTable
ALTER TABLE `ProfitClosing` ADD COLUMN `debtPaid` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `debtPayments` JSON NULL;
