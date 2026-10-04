-- AlterTable
ALTER TABLE `Client` ADD COLUMN `inTrial` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `trialEndsAt` DATETIME(3) NULL;

