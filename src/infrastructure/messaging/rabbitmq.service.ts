import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Channel, Connection, ConsumeMessage, connect } from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection?: Connection;
  private channel?: Channel;

  // Allow disabling RabbitMQ via env for local/dev where broker isn't available
  // Enabled only when explicitly set to "true" to avoid noisy connection errors in dev
  private readonly enabled = process.env.RABBITMQ_ENABLED === 'true';
  private readonly url = process.env.RABBITMQ_URL || 'amqp://localhost';
  private readonly exchange = process.env.RABBITMQ_EXCHANGE || 'campus-hub.events';

  async publish(routingKey: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.enabled) {
      this.logger.debug('RabbitMQ disabled; skipping publish');
      return;
    }

    const channel = await this.getChannel();
    const messageBuffer = Buffer.from(JSON.stringify(payload));
    try {
      channel.publish(this.exchange, routingKey, messageBuffer, {
        contentType: 'application/json',
        persistent: true,
        timestamp: Date.now(),
      });
      this.logger.debug(`Published message to ${this.exchange} with routingKey=${routingKey}`);
    } catch (error) {
      this.logger.warn(`RabbitMQ publish failed for ${routingKey}`, error as Error);
      throw error;
    }
  }

  async subscribe(
    routingKey: string,
    handler: (msg: any, raw: ConsumeMessage) => Promise<void> | void,
  ): Promise<void> {
    if (!this.enabled) {
      this.logger.debug('RabbitMQ disabled; skipping subscription');
      return;
    }

    try {
      const channel = await this.getChannel();
      const queue = await channel.assertQueue('', { exclusive: true, durable: false });
      await channel.bindQueue(queue.queue, this.exchange, routingKey);

      channel.consume(queue.queue, async (msg) => {
        if (!msg) return;
        try {
          const content = msg.content.length ? JSON.parse(msg.content.toString()) : {};
          await handler(content, msg);
          channel.ack(msg);
        } catch (error) {
          this.logger.warn(`Handler error for routingKey=${routingKey}: ${error}`);
          channel.nack(msg, false, false); // drop message to avoid infinite loop
        }
      });

      this.logger.log(`Subscribed queue=${queue.queue} binding=${routingKey} on exchange=${this.exchange}`);
    } catch (error) {
      this.logger.warn(`RabbitMQ subscribe failed for ${routingKey}`, error as Error);
    }
  }

  private async getChannel(): Promise<Channel> {
    if (!this.enabled) {
      throw new Error('RabbitMQ disabled');
    }

    if (this.channel) {
      return this.channel;
    }

    this.connection = await connect(this.url);
    this.connection.on('error', (err) => {
      this.logger.error('RabbitMQ connection error', err);
      this.connection = undefined;
      this.channel = undefined;
    });
    this.connection.on('close', () => {
      this.logger.warn('RabbitMQ connection closed');
      this.connection = undefined;
      this.channel = undefined;
    });

    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
    return this.channel;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch (error) {
      this.logger.warn('Error closing RabbitMQ connection', error as Error);
    }
  }
}
