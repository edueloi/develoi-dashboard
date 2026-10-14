ALTER TABLE `WppBotConfig`
  ADD COLUMN `geminiEnabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `geminiApiKeyEncrypted` TEXT NULL,
  ADD COLUMN `geminiModel` VARCHAR(80) NOT NULL DEFAULT 'gemini-3.8-flash',
  ADD COLUMN `geminiSystemPrompt` TEXT NULL;
