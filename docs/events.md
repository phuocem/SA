# Nhắn tin sự kiện

## Exchange & routing
- Exchange: `campus-hub.events` (topic, durable)
- Producer phát các routing key:
  - `event.created`
  - `event.updated`
  - `event.deleted`

## Định dạng message
Trường chung:
- `event_id`: number
- `name`: string (tạo/cập nhật)
- `start_time`: ISO string (tạo/cập nhật)
- `end_time`: ISO string (tạo/cập nhật)

Ví dụ:
```json
{ "event_id": 12, "name": "Hackathon", "start_time": "2025-12-31T10:00:00Z", "end_time": "2025-12-31T16:00:00Z" }
```
```json
{ "event_id": 12 }
```

## Producer (backend)
- Khi tạo → publish `event.created`
- Khi cập nhật → publish `event.updated`
- Khi xoá → publish `event.deleted`
- Nằm trong `EventsService` dùng `RabbitMQService.publish()`.

## Subscriber (mặc định)
- `RabbitMQConsumer` subscribe `event.*` và log payload (smoke test).
- Chạy khi app khởi động (OnModuleInit).

## Chính sách retry / backoff
- Publisher: fire-and-forget; lỗi publish thì log cảnh báo rồi tiếp tục.
- Consumer: `nack` không requeue khi handler lỗi để tránh vòng lặp vô hạn. Production nên dùng DLQ + retry/backoff (ví dụ backoff lũy thừa với delayed exchange).

## Test local
1. Khởi chạy RabbitMQ (Docker): `docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management`
2. Thiết lập env nếu cần: `RABBITMQ_URL=amqp://localhost`, `RABBITMQ_EXCHANGE=campus-hub.events`.
3. Start app: `npm run start:dev`.
4. Gọi API tạo sự kiện:
   - `POST /events` (create)
   - `PUT /events/:id` (update)
   - `DELETE /events/:id` (delete)
5. Xem log từ `RabbitMQConsumer` hoặc bind queue trong RabbitMQ UI (exchange `campus-hub.events`, routing key `event.*`).

## Ghi chú vận hành
- Exchange được assert là topic durable; queue tự động của consumer mặc định là non-durable/exclusive (chỉ để test).
- Consumer thật nên tạo queue durable, bind routing key rõ ràng; triển khai idempotency và retry.
