import { Module } from '@nestjs/common';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { EventsModule } from './api/events/events.module';
import { RegistrationsModule } from './api/registrations/registrations.module';
import { AuthModule } from './api/auth/auth.module';
import { UsersModule } from './api/users/users.module';

@Module({
  imports: [PrismaModule, CacheModule, EventsModule, RegistrationsModule, AuthModule, UsersModule],
})
export class AppModule {}