# Hướng dẫn Outbox Pattern

Hệ thống dùng Outbox để đảm bảo gửi sự kiện tới RabbitMQ ngay cả khi broker tạm thời gián đoạn.

## Đã bổ sung
- **Database**: bảng `outbox_events` lưu sự kiện pending với trạng thái, số lần thử và thời điểm backoff.
- **Processor**: vòng lặp nền quét hàng đợi và publish với backoff + giới hạn số lần thử.
- **Service**: `OutboxService` cho phép enqueue ngay trong cùng transaction với nghiệp vụ.
- **Idempotency cho consumer**: thông điệp được khử trùng theo consumer qua bảng `message_consumptions` (khóa `consumer + messageId`).

## Cách hoạt động
1. Nghiệp vụ ghi dữ liệu và gọi `OutboxService.enqueue(...)` **trong cùng transaction**.
2. Processor lấy các hàng `pending` theo thứ tự `id`, claim (`processing`) và publish RabbitMQ.
3. Thành công → chuyển `published`; lỗi → tăng attempts, đẩy `available_at` theo backoff. Quá `OUTBOX_MAX_ATTEMPTS` → `failed` để rà soát thủ công.

## Cấu hình
Biến môi trường (mặc định trong ngoặc):
- `RABBITMQ_ENABLED` (`false`): bật RabbitMQ client và outbox delivery.
- `RABBITMQ_URL` (`amqp://localhost`), `RABBITMQ_EXCHANGE` (`campus-hub.events`).
- `OUTBOX_PROCESSOR_ENABLED` (`true`): bật/tắt processor.
- `OUTBOX_POLL_INTERVAL_MS` (`5000`): chu kỳ quét.
- `OUTBOX_BATCH_SIZE` (`20`): số bản ghi mỗi lần quét.
- `OUTBOX_MAX_ATTEMPTS` (`8`): quá số này chuyển `failed`.
- `OUTBOX_BACKOFF_BASE_MS` (`2000`), `OUTBOX_MAX_BACKOFF_MS` (`60000`): cửa sổ backoff lũy thừa.

## Triển khai & migrate
1. Tạo bảng: `npx prisma migrate deploy` (hoặc `prisma migrate dev` cho dev). Migration tại `prisma/migrations/20251230000000_outbox_events/migration.sql`.
2. Regenerate Prisma client: `npx prisma generate`.
3. Chạy app với RabbitMQ: `RABBITMQ_ENABLED=true npm run start:dev`.

### Tiêu thụ idempotent
- Outbox publish với `messageId=outbox-{outbox_event_id}` và header `aggregate_type`, `aggregate_id`.
- Consumer bật khử trùng bằng `subscribe(..., { consumerName: 'my-consumer', idempotent: true })`; mặc định duplicate sẽ ACK (có thể đổi bằng `onDuplicate`).
- Lưu trữ: bảng `message_consumptions` ghi lại message đã xử lý theo consumer.

## Dùng outbox trong code
- Import `OutboxService` vào module, inject vào service.
- Gói dữ liệu và `enqueue` trong cùng Prisma transaction:

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

## Vận hành outbox
- **Xem pending**: `SELECT * FROM outbox_events WHERE status = 'pending' ORDER BY available_at;`
- **Retry bản ghi failed**: đặt `status='pending', attempts=0, available_at=NOW()` cho các `id` cần retry, processor sẽ tự xử lý.
- **Xem lỗi cuối**: đọc cột `last_error` để biết lý do fail.
- **Tạm dừng**: đặt `OUTBOX_PROCESSOR_ENABLED=false` (message sẽ tích tụ ở `pending`).

## Khắc phục sự cố
- RabbitMQ tắt → bản ghi ở `pending` đến khi bật lại, đây là hành vi kỳ vọng.
- Không thấy bản ghi dịch chuyển → kiểm tra biến chu kỳ poll và OutboxProcessor đã được load qua `OutboxModule`.
- Giữ `OUTBOX_MAX_ATTEMPTS` hợp lý; tinh chỉnh backoff để tránh vòng lặp nóng.
