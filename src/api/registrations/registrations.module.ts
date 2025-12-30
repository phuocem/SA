import { Module } from '@nestjs/common';
import { CacheModule } from '../../infrastructure/cache/cache.module';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
})
export class RegistrationsModule {}