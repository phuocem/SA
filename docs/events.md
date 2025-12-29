# Events Messaging

## Exchange & Routing
- Exchange: `campus-hub.events` (topic, durable)
- Producer emits routing keys:
  - `event.created`
  - `event.updated`
  - `event.deleted`

## Message Format
Common fields:
- `event_id`: number
- `name`: string (for create/update)
- `start_time`: ISO string (for create/update)
- `end_time`: ISO string (for create/update)

Examples:
```json
{ "event_id": 12, "name": "Hackathon", "start_time": "2025-12-31T10:00:00Z", "end_time": "2025-12-31T16:00:00Z" }
```
```json
{ "event_id": 12 }
```

## Producer (backend)
- On create → publish `event.created`
- On update → publish `event.updated`
- On delete → publish `event.deleted`
- Implemented in `EventsService` using `RabbitMQService.publish()`.

## Subscriber (basic built-in)
- `RabbitMQConsumer` subscribes to `event.*` and logs message payloads (smoke test).
- Runs on app startup (OnModuleInit).

## Retry / Backoff Policy
- Publisher: fire-and-forget; on publish error, log warning and continue.
- Consumer: `nack` without requeue on handler error to avoid infinite loops. For production, replace with DLQ + retry/backoff strategy (e.g., exponential backoff with delayed exchanges).

## Local Testing Steps
1. Start RabbitMQ (Docker): `docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management`
2. Set env if needed: `RABBITMQ_URL=amqp://localhost`, `RABBITMQ_EXCHANGE=campus-hub.events`.
3. Start app: `npm run start:dev`.
4. Trigger events via API:
   - `POST /events` (create)
   - `PUT /events/:id` (update)
   - `DELETE /events/:id` (delete)
5. Observe logs from `RabbitMQConsumer` or bind a queue in RabbitMQ UI (exchange `campus-hub.events`, routing key `event.*`).

## Operational Notes
- Exchange asserted as durable topic; auto-queue used by built-in consumer is non-durable/exclusive (for testing).
- For real consumers, create durable queues and bind with explicit routing keys; implement idempotency and retries.
