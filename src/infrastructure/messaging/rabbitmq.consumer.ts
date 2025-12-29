import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';

/**
 * Basic subscriber that listens to all event.* messages and logs them.
 * Intended as a smoke test / visibility tool.
 */
@Injectable()
export class RabbitMQConsumer implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQConsumer.name);

  constructor(private readonly rabbit: RabbitMQService) {}

  async onModuleInit(): Promise<void> {
    // Subscribe to all event-related routing keys
    await this.rabbit.subscribe('event.*', async (msg) => {
      this.logger.log(`Received message: ${JSON.stringify(msg)}`);
    });
  }
}
