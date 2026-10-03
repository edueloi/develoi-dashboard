-- AlterTable
ALTER TABLE `Payable` ADD COLUMN `recurrenceEvery` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `recurrenceUnit` VARCHAR(10) NOT NULL DEFAULT 'month';

