// src/api/events/events.module.ts
import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { OutboxModule } from '../../infrastructure/messaging/outbox.module';

@Module({
  imports: [PrismaModule, OutboxModule],      
  controllers: [EventsController],
  providers: [EventsService],   
})
export class EventsModule {}