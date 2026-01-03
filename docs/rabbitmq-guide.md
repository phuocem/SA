# Hướng dẫn RabbitMQ trong dự án

## Mục đích
- Phát sự kiện bất đồng bộ qua RabbitMQ để các consumer xử lý sau (gửi email, đồng bộ hệ khác, v.v.).
- Đảm bảo độ tin cậy nhờ Outbox pattern: ghi sự kiện vào DB, processor sẽ publish khi broker sẵn sàng.

## Thành phần chính
- `OutboxService`: enqueue sự kiện vào bảng `outbox_events` trong cùng transaction nghiệp vụ.
- `OutboxProcessor`: nền quét outbox, publish lên RabbitMQ với routing key tương ứng.
- `RabbitMQService`: giữ kết nối/channel lâu dài, publish/subscribe, tránh tạo queue trùng lặp.

## Cấu hình
- Biến môi trường (đã set sẵn trong `.env`):
  - `RABBITMQ_ENABLED=true`
  - `RABBITMQ_URL=amqp://guest:guest@localhost:5672`
  - `RABBITMQ_EXCHANGE=campus-hub.events`
- Broker: Docker nhanh
  ```bash
  docker run -d --name rabbit -p 5672:5672 -p 15672:15672 rabbitmq:3-management
  # UI: http://localhost:15672 (guest/guest)
  ```

## Luồng sự kiện đang có
- Event CRUD: `event.created`, `event.updated`, `event.deleted` (phát từ `EventsService`).
- Đăng ký sự kiện: `registration.created`, `registration.cancelled` (phát từ `RegistrationsService`).

## Cách publish (code mẫu)
```ts
await this.outboxService.enqueue({
  routingKey: 'registration.created',
  aggregateType: 'registration',
  aggregateId: created.registration_id,
  payload: created,
});
```
OutboxProcessor sẽ lấy bản ghi này và publish lên exchange `campus-hub.events`.

## Cách subscribe (code mẫu)
```ts
this.rabbitMQService.subscribe(
  'registration.*',
  async (msg) => {
    // xử lý gửi email/QR...
  },
  { consumerName: 'registration-consumer', idempotent: true }
);
```
- `consumerName` cố định → queue bền `ch-registration-consumer`, tránh tạo queue mới mỗi lần.
- `idempotent: true` + MessageIdempotencyService → chống xử lý trùng.

## Hành vi RabbitMQService
- Giữ 1 connection/channel (long-lived); dùng `channelPromise` để tránh mở trùng khi gọi song song.
- Mỗi consumerName tạo 1 queue durable `ch-{consumerName}`, bind routing key được chỉ định.
- Bỏ qua subscribe trùng lặp bằng `subscribedConsumers`.

## Lưu ý vận hành
- Nếu RabbitMQ tắt: outbox ở trạng thái pending, không mất sự kiện; bật broker lại sẽ publish.
- Muốn tắt hoàn toàn: đặt `RABBITMQ_ENABLED=false` (publish/subscribe skip, outbox vẫn ghi nhưng không push được).
- Kiểm tra message: xem UI queue/exchange hoặc log `RabbitMQConsumer` (nếu có consumer mẫu).

## Mở rộng use-case
- Thông báo/email: publish `notification.email` và tạo consumer gửi mail.
- Đồng bộ báo cáo: publish `registration.*`/`event.*` để hệ reporting ingest.
- Job nền: publish `report.generate`, worker subscribe và chạy nặng.
