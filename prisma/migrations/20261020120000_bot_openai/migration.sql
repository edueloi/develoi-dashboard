ALTER TABLE `WppBotConfig`
  ADD COLUMN `aiProvider` VARCHAR(20) NOT NULL DEFAULT 'gemini',
  ADD COLUMN `aiFirst` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `openaiApiKeyEncrypted` TEXT NULL,
  ADD COLUMN `openaiModel` VARCHAR(80) NOT NULL DEFAULT 'gpt-4o-mini';
