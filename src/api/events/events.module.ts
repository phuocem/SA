// src/api/events/events.module.ts
import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { RabbitMQModule } from '../../infrastructure/messaging/rabbitmq.module';

@Module({
  imports: [PrismaModule, RabbitMQModule],      
  controllers: [EventsController],
  providers: [EventsService],   
})
export class EventsModule {}