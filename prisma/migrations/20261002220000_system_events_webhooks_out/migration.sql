-- CreateTable
CREATE TABLE `SystemEvent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `model` VARCHAR(60) NOT NULL,
    `action` VARCHAR(20) NOT NULL,
    `recordId` VARCHAR(64) NULL,
    `data` TEXT NULL,
    `source` VARCHAR(20) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dispatchedAt` DATETIME(3) NULL,

    INDEX `SystemEvent_dispatchedAt_idx`(`dispatchedAt`),
    INDEX `SystemEvent_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebhookEndpoint` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `secret` VARCHAR(80) NOT NULL,
    `events` TEXT NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebhookDelivery` (
    `id` VARCHAR(191) NOT NULL,
    `endpointId` VARCHAR(191) NOT NULL,
    `eventId` INTEGER NOT NULL,
    `event` VARCHAR(80) NOT NULL,
    `status` VARCHAR(15) NOT NULL DEFAULT 'pending',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `nextAttemptAt` DATETIME(3) NULL,
    `lastStatusCode` INTEGER NULL,
    `lastError` VARCHAR(300) NULL,
    `durationMs` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deliveredAt` DATETIME(3) NULL,

    INDEX `WebhookDelivery_status_nextAttemptAt_idx`(`status`, `nextAttemptAt`),
    INDEX `WebhookDelivery_endpointId_createdAt_idx`(`endpointId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WebhookDelivery` ADD CONSTRAINT `WebhookDelivery_endpointId_fkey` FOREIGN KEY (`endpointId`) REFERENCES `WebhookEndpoint`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

