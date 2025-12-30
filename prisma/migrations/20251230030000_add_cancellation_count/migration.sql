-- Add cancellation_count to track how many times a user cancels
ALTER TABLE `registrations`
ADD COLUMN `cancellation_count` INT NOT NULL DEFAULT 0;
