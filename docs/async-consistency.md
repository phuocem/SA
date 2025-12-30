# Nhắn tin bất đồng bộ & Nhất quán

## Các pattern sử dụng
- **Outbox**: hàng đợi trong DB có retry/backoff; publish RabbitMQ với `messageId` ổn định.
- **Idempotency cho consumer**: khử trùng trên mỗi consumer qua bảng `message_consumptions` unique `(consumer, message_id)`.
- **Saga helper**: luồng nhiều bước tại chỗ kèm bù trừ.

## Ngữ nghĩa giao hàng
- Producer: at-least-once nhờ retry của outbox.
- Consumer: nhận at-least-once nhưng xử lý idempotent → thực tế chỉ một lần theo `messageId` cho mỗi consumer.

## Xử lý lỗi
- Broker down: outbox giữ trạng thái `pending`; tự gửi lại khi broker lên.
- Publish lỗi: outbox retry exponential backoff (`OUTBOX_BACKOFF_BASE_MS`, `OUTBOX_MAX_BACKOFF_MS`), dừng ở `OUTBOX_MAX_ATTEMPTS` → `failed`.
- Consumer crash sau khi đã làm side-effect: message sẽ được giao lại; hãy viết handler idempotent / side-effect bền vững.

## Câu lệnh vận hành
- Pending: `SELECT * FROM outbox_events WHERE status='pending' ORDER BY available_at;`
- Failed: `SELECT * FROM outbox_events WHERE status='failed' ORDER BY updated_at DESC;`
- Lịch sử dedup: `SELECT * FROM message_consumptions WHERE consumer='<name>' ORDER BY processed_at DESC;`

## Tóm tắt cấu hình
- `RABBITMQ_ENABLED`: bật producer/consumer.
- `OUTBOX_PROCESSOR_ENABLED`: bật poller outbox.
- `OUTBOX_POLL_INTERVAL_MS`, `OUTBOX_BATCH_SIZE`, `OUTBOX_MAX_ATTEMPTS`, `OUTBOX_BACKOFF_BASE_MS`, `OUTBOX_MAX_BACKOFF_MS`.
- `OUTBOX_PROCESSOR_ENABLED=false` → message giữ ở trạng thái pending.

## Hướng dẫn cho consumer mới
1) Subscribe với `idempotent: true` và `consumerName` ổn định.
2) Nếu tự publish, dùng `messageId` ổn định theo domain; outbox đã gán `outbox-{id}` sẵn.
3) Viết handler idempotent: upsert, delete-ignore-not-found, guard bằng business key.
4) Log/monitor lỗi; cân nhắc DLQ ở RabbitMQ nếu cần.

## Quan điểm nhất quán
- Nhất quán mạnh trong giao dịch đơn dịch vụ (Prisma).
- Nhất quán cuối trên biên async; outbox + idempotency giảm trùng lặp và đảo thứ tự.
