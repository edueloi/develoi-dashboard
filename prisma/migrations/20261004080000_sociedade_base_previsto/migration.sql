-- AlterTable
ALTER TABLE `ProfitConfig` ADD COLUMN `basis` VARCHAR(10) NOT NULL DEFAULT 'planned';

-- AlterTable
ALTER TABLE `ProfitClosing` ADD COLUMN `basis` VARCHAR(10) NOT NULL DEFAULT 'planned';
