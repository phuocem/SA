-- Message consumption log for idempotent subscribers
CREATE TABLE `message_consumptions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `consumer` VARCHAR(100) NOT NULL,
  `message_id` VARCHAR(255) NOT NULL,
  `processed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `message_consumptions_consumer_message_id_key` (`consumer`, `message_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
