-- CreateTable
CREATE TABLE `Partner` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `sharePercent` DOUBLE NOT NULL DEFAULT 0,
    `email` VARCHAR(150) NULL,
    `role` VARCHAR(80) NULL,
    `color` VARCHAR(9) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProfitConfig` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'main',
    `reservePercent` DOUBLE NOT NULL DEFAULT 0,
    `reimbursementsAsExpense` BOOLEAN NOT NULL DEFAULT true,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProfitClosing` (
    `id` VARCHAR(191) NOT NULL,
    `month` VARCHAR(7) NOT NULL,
    `revenue` DOUBLE NOT NULL,
    `expenses` DOUBLE NOT NULL,
    `profit` DOUBLE NOT NULL,
    `reserve` DOUBLE NOT NULL,
    `distributable` DOUBLE NOT NULL,
    `shares` JSON NOT NULL,
    `notes` TEXT NULL,
    `closedByName` VARCHAR(100) NULL,
    `closedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ProfitClosing_month_key`(`month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

