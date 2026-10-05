-- AlterTable
ALTER TABLE `BusinessGoal` ADD COLUMN `category` VARCHAR(40) NULL,
    ADD COLUMN `completedAt` DATETIME(3) NULL,
    ADD COLUMN `currentValue` DOUBLE NULL,
    ADD COLUMN `metricLabel` VARCHAR(80) NULL,
    ADD COLUMN `metricUnit` VARCHAR(12) NULL,
    ADD COLUMN `priority` VARCHAR(10) NOT NULL DEFAULT 'medium',
    ADD COLUMN `startDate` DATETIME(3) NULL,
    ADD COLUMN `startValue` DOUBLE NULL,
    ADD COLUMN `steps` JSON NULL,
    ADD COLUMN `targetValue` DOUBLE NULL,
    ADD COLUMN `updates` JSON NULL;

