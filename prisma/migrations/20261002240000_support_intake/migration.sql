-- AlterTable
ALTER TABLE `Product` ADD COLUMN `supportEnabled` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `WppBotSector` ADD COLUMN `intake` VARCHAR(20) NOT NULL DEFAULT 'none';

-- AlterTable
ALTER TABLE `WppConversation` ADD COLUMN `clientDocument` VARCHAR(20) NULL,
    ADD COLUMN `linkedClientId` VARCHAR(36) NULL,
    ADD COLUMN `subject` VARCHAR(255) NULL;

