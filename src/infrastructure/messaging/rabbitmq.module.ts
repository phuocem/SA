import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { RabbitMQConsumer } from './rabbitmq.consumer';
import { PrismaModule } from '../prisma/prisma.module';
import { MessageIdempotencyService } from './message-idempotency.service';

@Module({
  imports: [PrismaModule],
  providers: [RabbitMQService, RabbitMQConsumer, MessageIdempotencyService],
  exports: [RabbitMQService],
})
export class RabbitMQModule {}
