# Outbox Pattern Guide

This project now uses an Outbox pattern to guarantee reliable event publishing to RabbitMQ even when the broker is down or network blips occur.

## What was added
- **Database**: `outbox_events` table stores pending events with status, attempts, and backoff timestamps.
- **Processor**: A background polling loop flushes pending rows to RabbitMQ with exponential backoff and max-attempt guard.
- **Service**: `OutboxService` lets features enqueue events inside the same database transaction that mutates business data.

## How it works
1. Your feature writes domain data and calls `OutboxService.enqueue(...)` in the **same transaction**.
2. The outbox processor (interval worker) pulls `pending` rows ordered by `id`, claims them (`processing`), and publishes to RabbitMQ.
3. On success the row becomes `published`; on failure attempts are incremented and `available_at` is pushed forward using exponential backoff. After `OUTBOX_MAX_ATTEMPTS` the row is marked `failed` for manual review.

## Configuration
Environment variables (defaults in parentheses):
- `RABBITMQ_ENABLED` (`false`): Enable RabbitMQ client and outbox delivery.
- `RABBITMQ_URL` (`amqp://localhost`), `RABBITMQ_EXCHANGE` (`campus-hub.events`).
- `OUTBOX_PROCESSOR_ENABLED` (`true`): Turn processor on/off.
- `OUTBOX_POLL_INTERVAL_MS` (`5000`): Polling interval.
- `OUTBOX_BATCH_SIZE` (`20`): Max rows per flush.
- `OUTBOX_MAX_ATTEMPTS` (`8`): After this, status becomes `failed`.
- `OUTBOX_BACKOFF_BASE_MS` (`2000`), `OUTBOX_MAX_BACKOFF_MS` (`60000`): Exponential backoff window.

## Deploy & migrate
1. Create the table: `npx prisma migrate deploy` (or `prisma migrate dev` for dev). The migration file is at `prisma/migrations/20251230000000_outbox_events/migration.sql`.
2. Regenerate Prisma client after schema changes: `npx prisma generate`.
3. Start the app with RabbitMQ enabled: `RABBITMQ_ENABLED=true npm run start:dev`.

## Using the outbox in code
- Import `OutboxService` in your module and inject it into the service layer.
- Wrap data changes and `enqueue` in the same Prisma transaction:

```typescript
const result = await this.prisma.$transaction(async (tx) => {
  const entity = await tx.event.create({ data: payload });
  await this.outboxService.enqueue({
    routingKey: 'event.created',
    aggregateType: 'event',
    aggregateId: entity.event_id,
    payload: { event_id: entity.event_id, name: entity.name },
  }, tx);
  return entity;
});
```

## Operating the outbox
- **Check pending**: `SELECT * FROM outbox_events WHERE status = 'pending' ORDER BY available_at;`
- **Retry failed rows**: set `status='pending', attempts=0, available_at=NOW()` for the chosen `id` values, then let the processor pick them up.
- **Inspect last error**: look at the `last_error` column to see why delivery failed.
- **Disable temporarily**: set `OUTBOX_PROCESSOR_ENABLED=false` (messages will accumulate with `pending` status until re-enabled).

## Troubleshooting
- If RabbitMQ is disabled, rows stay `pending` until it is enabled; this is expected.
- If no rows are moving, verify the processor interval env vars and that `OutboxProcessor` is registered (loaded via `OutboxModule`).
- Keep `OUTBOX_MAX_ATTEMPTS` reasonable to avoid hot loops; use backoff settings to throttle.
