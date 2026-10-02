-- AlterTable
ALTER TABLE `Client` ADD COLUMN `boxsysError` VARCHAR(255) NULL,
    ADD COLUMN `boxsysStatus` VARCHAR(20) NULL,
    ADD COLUMN `boxsysSubdomain` VARCHAR(80) NULL,
    ADD COLUMN `boxsysSyncedAt` DATETIME(3) NULL,
    ADD COLUMN `boxsysTenantId` VARCHAR(20) NULL,
    ADD COLUMN `boxsysUrl` VARCHAR(255) NULL;

