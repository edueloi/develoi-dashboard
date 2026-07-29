-- CreateTable
CREATE TABLE `bloganalytics` (
    `id` VARCHAR(191) NOT NULL,
    `postId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `views` INTEGER NOT NULL DEFAULT 1,

    INDEX `BlogAnalytics_postId_fkey`(`postId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blogauthor` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `bio` TEXT NULL,
    `photo` LONGTEXT NULL,
    `role` VARCHAR(191) NULL,
    `linkedin` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `BlogAuthor_slug_key`(`slug` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blogcategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#6366f1',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `BlogCategory_slug_key`(`slug` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blogpost` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `excerpt` TEXT NULL,
    `content` LONGTEXT NOT NULL,
    `coverImage` LONGTEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `tags` TEXT NULL,
    `views` INTEGER NOT NULL DEFAULT 0,
    `readTimeMinutes` INTEGER NOT NULL DEFAULT 1,
    `publishedAt` DATETIME(3) NULL,
    `seoTitle` VARCHAR(191) NULL,
    `seoDescription` TEXT NULL,
    `seoKeywords` TEXT NULL,
    `categoryId` VARCHAR(191) NULL,
    `authorId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BlogPost_authorId_fkey`(`authorId` ASC),
    INDEX `BlogPost_categoryId_fkey`(`categoryId` ASC),
    UNIQUE INDEX `BlogPost_slug_key`(`slug` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blogsubscriber` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `BlogSubscriber_email_key`(`email` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `case` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `client` VARCHAR(191) NOT NULL,
    `excerpt` TEXT NULL,
    `content` LONGTEXT NOT NULL,
    `coverImage` LONGTEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `tags` TEXT NULL,
    `views` INTEGER NOT NULL DEFAULT 0,
    `likes` INTEGER NOT NULL DEFAULT 0,
    `readTimeMinutes` INTEGER NOT NULL DEFAULT 1,
    `publishedAt` DATETIME(3) NULL,
    `seoTitle` VARCHAR(191) NULL,
    `seoDescription` TEXT NULL,
    `seoKeywords` TEXT NULL,
    `segment` TEXT NULL,
    `services` TEXT NULL,
    `results` TEXT NULL,
    `challenge` TEXT NULL,
    `solution` TEXT NULL,
    `categoryId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Case_categoryId_fkey`(`categoryId` ASC),
    UNIQUE INDEX `Case_slug_key`(`slug` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `casecategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#6366f1',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `CaseCategory_slug_key`(`slug` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `client` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `document` VARCHAR(191) NULL,
    `birthDate` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `saleId` VARCHAR(191) NULL,
    `billingValue` DOUBLE NOT NULL DEFAULT 0,
    `billingCycle` VARCHAR(191) NOT NULL DEFAULT 'monthly',
    `dueDay` INTEGER NULL,
    `nextDueDate` DATETIME(3) NULL,
    `reminderDaysBefore` INTEGER NOT NULL DEFAULT 5,
    `graceDaysAfter` INTEGER NOT NULL DEFAULT 7,
    `soldById` VARCHAR(191) NULL,
    `soldByName` VARCHAR(191) NULL,
    `commissionType` VARCHAR(191) NULL,
    `commissionValue` DOUBLE NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientcontact` (
    `id` VARCHAR(191) NOT NULL,
    `clientName` VARCHAR(191) NOT NULL,
    `clientPhone` VARCHAR(191) NULL,
    `clientEmail` VARCHAR(191) NULL,
    `productName` VARCHAR(191) NULL,
    `messageId` VARCHAR(191) NULL,
    `messageTitle` VARCHAR(191) NULL,
    `channel` VARCHAR(191) NOT NULL DEFAULT 'whatsapp',
    `status` VARCHAR(191) NOT NULL DEFAULT 'new',
    `notes` TEXT NULL,
    `scheduledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `city` VARCHAR(191) NULL,
    `clientPhone2` VARCHAR(191) NULL,
    `contactCount` INTEGER NOT NULL DEFAULT 0,
    `establishmentName` VARCHAR(191) NULL,
    `lastContactAt` DATETIME(3) NULL,
    `ownerName` VARCHAR(191) NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `segment` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientproject` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ClientProject_clientId_projectId_key`(`clientId` ASC, `projectId` ASC),
    INDEX `ClientProject_projectId_fkey`(`projectId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feature` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `sprintId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'todo',
    `priority` VARCHAR(191) NULL DEFAULT 'medium',
    `category` VARCHAR(191) NULL,
    `assignedTo` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'task',
    `tags` JSON NULL,
    `points` INTEGER NOT NULL DEFAULT 1,
    `deadline` DATETIME(3) NULL,
    `activities` TEXT NULL,
    `testCases` LONGTEXT NULL,
    `testEvidence` TEXT NULL,
    `testObservations` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reporter` VARCHAR(191) NULL,
    `functionalArea` VARCHAR(191) NULL,
    `acceptanceCriteria` TEXT NULL,
    `functionalRequirements` TEXT NULL,
    `linkedDemandId` VARCHAR(191) NULL,
    `linkedDemandTitle` VARCHAR(512) NULL,
    `businessRules` TEXT NULL,

    INDEX `Feature_projectId_fkey`(`projectId` ASC),
    INDEX `Feature_sprintId_fkey`(`sprintId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `senderName` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Message_projectId_fkey`(`projectId` ASC),
    INDEX `Message_senderId_fkey`(`senderId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `portfolioitem` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `category` VARCHAR(191) NULL,
    `imageURL` VARCHAR(191) NULL,
    `link` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `category` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'service',
    `price` DOUBLE NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BRL',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `features` JSON NULL,
    `tags` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `clientName` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `progress` INTEGER NOT NULL DEFAULT 0,
    `deadline` DATETIME(3) NULL,
    `visibility` VARCHAR(191) NOT NULL DEFAULT 'public',
    `allowedUsers` JSON NULL,
    `goals` JSON NULL,
    `financials` TEXT NULL,
    `history` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `readymessage` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    `productId` VARCHAR(191) NULL,
    `productName` VARCHAR(191) NULL,
    `body` TEXT NOT NULL,
    `tags` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isFavorite` BOOLEAN NOT NULL DEFAULT false,
    `userId` VARCHAR(191) NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sale` (
    `id` VARCHAR(191) NOT NULL,
    `clientName` VARCHAR(191) NOT NULL,
    `clientEmail` VARCHAR(191) NULL,
    `clientPhone` VARCHAR(191) NULL,
    `productId` VARCHAR(191) NOT NULL,
    `productName` VARCHAR(191) NOT NULL,
    `productCategory` VARCHAR(191) NOT NULL DEFAULT '',
    `value` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'lead',
    `paymentMethod` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `origin` VARCHAR(191) NULL,
    `closedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `soldById` VARCHAR(191) NULL,
    `soldByName` VARCHAR(191) NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sitevalues` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `mission` TEXT NOT NULL,
    `vision` TEXT NOT NULL,
    `values` JSON NOT NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sprint` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `goal` TEXT NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'planned',
    `projectId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Sprint_projectId_fkey`(`projectId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teammember` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `bio` TEXT NULL,
    `photoURL` LONGTEXT NULL,
    `linkedin` VARCHAR(191) NULL,
    `github` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `instagram` VARCHAR(191) NULL,
    `specialty` TEXT NULL,
    `formation` TEXT NULL,
    `curiosities` TEXT NULL,
    `hobbies` TEXT NULL,
    `location` VARCHAR(191) NULL,
    `yearsExp` INTEGER NULL,
    `mission` TEXT NULL,
    `missionPublic` BOOLEAN NOT NULL DEFAULT true,
    `responsibilities` TEXT NULL,
    `responsibilitiesPublic` BOOLEAN NOT NULL DEFAULT false,
    `objectives` TEXT NULL,
    `objectivesPublic` BOOLEAN NOT NULL DEFAULT false,
    `expectations` TEXT NULL,
    `expectationsPublic` BOOLEAN NOT NULL DEFAULT false,
    `phrase` VARCHAR(512) NULL,
    `phrasePublic` BOOLEAN NOT NULL DEFAULT true,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `uid` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `photoURL` VARCHAR(191) NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'viewer',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `token` TEXT NULL,

    UNIQUE INDEX `User_email_key`(`email` ASC),
    PRIMARY KEY (`uid` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wppbotconfig` (
    `id` VARCHAR(191) NOT NULL,
    `botEnabled` BOOLEAN NOT NULL DEFAULT false,
    `sendWelcome` BOOLEAN NOT NULL DEFAULT true,
    `menuEnabled` BOOLEAN NOT NULL DEFAULT false,
    `menuWelcomeMsg` TEXT NULL,
    `menuOptions` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wppbotflownode` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(30) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NULL,
    `options` TEXT NULL,
    `sectorId` VARCHAR(36) NULL,
    `inputVar` VARCHAR(50) NULL,
    `nextNodeId` VARCHAR(36) NULL,
    `isStart` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `posX` INTEGER NOT NULL DEFAULT 0,
    `posY` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wppbotsector` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `menuKey` VARCHAR(10) NOT NULL,
    `description` VARCHAR(255) NULL,
    `attendants` TEXT NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wppconversation` (
    `id` VARCHAR(191) NOT NULL,
    `sectorId` VARCHAR(191) NULL,
    `clientPhone` VARCHAR(30) NOT NULL,
    `clientName` VARCHAR(255) NULL,
    `attendantName` VARCHAR(100) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'waiting',
    `firstMessage` VARCHAR(1000) NULL,
    `closedBy` VARCHAR(20) NULL,
    `closedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WppConversation_sectorId_fkey`(`sectorId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wppconversationmessage` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `fromRole` VARCHAR(20) NOT NULL,
    `fromPhone` VARCHAR(30) NULL,
    `body` TEXT NOT NULL,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WppConversationMessage_conversationId_fkey`(`conversationId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wppinstance` (
    `id` VARCHAR(191) NOT NULL,
    `instanceName` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'not_configured',
    `qrCode` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bloganalytics` ADD CONSTRAINT `BlogAnalytics_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `blogpost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blogpost` ADD CONSTRAINT `BlogPost_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `blogauthor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blogpost` ADD CONSTRAINT `BlogPost_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `blogcategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `case` ADD CONSTRAINT `Case_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `casecategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clientproject` ADD CONSTRAINT `ClientProject_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clientproject` ADD CONSTRAINT `ClientProject_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feature` ADD CONSTRAINT `Feature_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feature` ADD CONSTRAINT `Feature_sprintId_fkey` FOREIGN KEY (`sprintId`) REFERENCES `sprint`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message` ADD CONSTRAINT `Message_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message` ADD CONSTRAINT `Message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `user`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sprint` ADD CONSTRAINT `Sprint_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wppconversation` ADD CONSTRAINT `WppConversation_sectorId_fkey` FOREIGN KEY (`sectorId`) REFERENCES `wppbotsector`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wppconversationmessage` ADD CONSTRAINT `WppConversationMessage_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `wppconversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

