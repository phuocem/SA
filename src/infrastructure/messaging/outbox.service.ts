import { Injectable } from '@nestjs/common';
import { OutboxStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface OutboxEnqueueInput {
  routingKey: string;
  payload: Prisma.InputJsonValue;
  aggregateType: string;
  aggregateId?: string | number;
  delayMs?: number;
}

@Injectable()
export class OutboxService {
  private readonly maxAttempts = Number(process.env.OUTBOX_MAX_ATTEMPTS ?? 8);
  private readonly backoffBaseMs = Number(process.env.OUTBOX_BACKOFF_BASE_MS ?? 2000);
  private readonly maxBackoffMs = Number(process.env.OUTBOX_MAX_BACKOFF_MS ?? 60000);

  constructor(private readonly prisma: PrismaService) {}

  async enqueue(input: OutboxEnqueueInput, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    const availableAt = input.delayMs ? new Date(Date.now() + input.delayMs) : new Date();

    await client.outboxEvent.create({
      data: {
        routing_key: input.routingKey,
        aggregate_type: input.aggregateType,
        aggregate_id: input.aggregateId?.toString(),
        payload: input.payload,
        available_at: availableAt,
      },
    });
  }

  async getPendingBatch(limit: number, now: Date) {
    return this.prisma.outboxEvent.findMany({
      where: {
        status: OutboxStatus.pending,
        available_at: { lte: now },
      },
      orderBy: { id: 'asc' },
      take: limit,
    });
  }

  async markProcessing(id: number): Promise<boolean> {
    const result = await this.prisma.outboxEvent.updateMany({
      where: { id, status: OutboxStatus.pending },
      data: { status: OutboxStatus.processing, updated_at: new Date() },
    });

    return result.count === 1;
  }

  async markPublished(id: number): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id },
      data: { status: OutboxStatus.published, published_at: new Date() },
    });
  }

  async markFailed(id: number, attempts: number, errorMessage?: string): Promise<void> {
    const status = attempts >= this.maxAttempts ? OutboxStatus.failed : OutboxStatus.pending;
    const nextAvailable = status === OutboxStatus.pending ? this.computeNextAvailable(attempts) : undefined;

    await this.prisma.outboxEvent.update({
      where: { id },
      data: {
        status,
        attempts,
        available_at: nextAvailable,
        last_error: errorMessage?.slice(0, 1000),
        updated_at: new Date(),
      },
    });
  }

  private computeNextAvailable(attempts: number): Date {
    const delay = Math.min(this.maxBackoffMs, this.backoffBaseMs * Math.pow(2, Math.max(0, attempts - 1)));
    return new Date(Date.now() + delay);
  }
}
