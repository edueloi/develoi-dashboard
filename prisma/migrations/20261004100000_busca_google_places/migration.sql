-- AlterTable
ALTER TABLE `Lead` ADD COLUMN `placeId` VARCHAR(80) NULL;

-- CreateIndex
CREATE INDEX `Lead_placeId_idx` ON `Lead`(`placeId`);

-- CreateTable
CREATE TABLE `PlacesUsage` (
    `month` VARCHAR(7) NOT NULL,
    `requests` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`month`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
