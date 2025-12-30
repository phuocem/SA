-- Align registration.status column with ENUM to match Prisma RegistrationStatus
ALTER TABLE `registrations`
  MODIFY `status` ENUM('registered','cancelled','checked_in','no_show') NOT NULL DEFAULT 'registered';
