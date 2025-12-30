import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { OutboxService } from './outbox.service';

@Injectable()
export class OutboxProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxProcessor.name);
  private readonly pollIntervalMs = Number(process.env.OUTBOX_POLL_INTERVAL_MS ?? 5000);
  private readonly batchSize = Number(process.env.OUTBOX_BATCH_SIZE ?? 20);
  private readonly enabled = process.env.OUTBOX_PROCESSOR_ENABLED !== 'false';
  private isRunning = false;
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly outboxService: OutboxService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.enabled) {
      this.logger.warn('Outbox processor disabled via OUTBOX_PROCESSOR_ENABLED=false');
      return;
    }

    if (this.pollIntervalMs <= 0) {
      this.logger.warn('Outbox processor interval is not positive; skipping startup');
      return;
    }

    this.timer = setInterval(() => this.safeFlush(), this.pollIntervalMs);
    await this.safeFlush();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async safeFlush(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      await this.flush();
    } catch (error) {
      this.logger.error('Outbox flush failed', error as Error);
    } finally {
      this.isRunning = false;
    }
  }

  private async flush(): Promise<void> {
    if (!this.rabbitMQService.isEnabled()) {
      this.logger.debug('RabbitMQ disabled; outbox will remain pending');
      return;
    }

    const now = new Date();
    const events = await this.outboxService.getPendingBatch(this.batchSize, now);
    if (!events.length) return;

    for (const event of events) {
      const claimed = await this.outboxService.markProcessing(event.id);
      if (!claimed) continue;

      try {
        const messageId = `outbox-${event.id}`;
        await this.rabbitMQService.publish(event.routing_key, event.payload as Record<string, unknown>, {
          messageId,
          headers: {
            aggregate_type: event.aggregate_type,
            aggregate_id: event.aggregate_id,
          },
        });
        await this.outboxService.markPublished(event.id);
      } catch (error) {
        const attempts = event.attempts + 1;
        await this.outboxService.markFailed(event.id, attempts, (error as Error).message ?? 'publish failed');
        this.logger.warn(`Outbox publish failed id=${event.id} attempts=${attempts}`);
      }
    }
  }
}
