import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { RabbitMQConsumer } from './rabbitmq.consumer';

@Module({
  providers: [RabbitMQService, RabbitMQConsumer],
  exports: [RabbitMQService],
})
export class RabbitMQModule {}
