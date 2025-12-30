# Nhất quán & Điều phối

## Sơ đồ outbox (lược tả)
```
(1) Business TX   ──(write domain change + outbox row)──> DB
                                   |
                             commit TX
                                   |
(2) Outbox Processor ──poll──> pending rows ──publish──> RabbitMQ
                                   |
                             mark published/failed
```
- (1) Ghi dữ liệu nghiệp vụ và outbox cùng một transaction để bảo toàn tính nguyên tử.
- (2) Processor lấy batch, claim `processing`, publish với `messageId=outbox-{id}` để downstream idempotent.

### Lược đồ outbox
- Bảng `outbox_events`: `id` (PK, bigserial), `routing_key`, `aggregate_type`, `aggregate_id`, `payload` (JSON), `status` (pending/processing/published/failed), `attempts`, `available_at`, `published_at`, `last_error`, `created_at`, `updated_at`.
- Chỉ số: `(status, available_at)` giúp poll nhanh; `aggregate_id` hỗ trợ truy vấn theo thực thể.
- Bảng `message_consumptions`: `id`, `message_id`, `consumer_name`, `consumed_at`, unique `(message_id, consumer_name)` để bỏ qua trùng lặp.

## Saga (diễn tiến & bù trừ)
```
[Step1] --ok--> [Step2] --ok--> [Step3]
   |fail           |fail          |fail
   v               v              v
compensate1    compensate2    compensate3

Trình tự:
1) Chạy action từng bước nối tiếp.
2) Khi một bước fail, gọi compensate của các bước đã hoàn thành theo thứ tự ngược.
```
- Dùng helper `Saga` tại `src/infrastructure/saga/saga.ts` để đóng gói action/compensate.
- Các compensate nên idempotent và an toàn nếu được gọi nhiều lần.

## Logic retry & backoff
- Outbox processor:
  - Poll định kỳ (`OUTBOX_POLL_INTERVAL_MS`), lấy batch (`OUTBOX_BATCH_SIZE`).
  - Claim sang `processing`, publish; lỗi publish → tăng `attempts`.
  - `available_at = now + min(OUTBOX_MAX_BACKOFF_MS, OUTBOX_BACKOFF_BASE_MS * 2^attempts)` (có thể thêm jitter nhỏ nếu cần).
  - Vượt `OUTBOX_MAX_ATTEMPTS` → đánh dấu `failed` để vận hành thủ công/replay.
- Consumer idempotent: dùng `messageId` ổn định, ghi log vào `message_consumptions` và bỏ qua nếu đã tồn tại.

## Nhất quán tổng thể
- Trong service: nhất quán mạnh nhờ transaction Prisma.
- Qua async: nhất quán cuối; outbox + idempotency giảm trùng và đảo thứ tự; Saga hỗ trợ bù trừ cho luồng nhiều bước trong cùng service.

## Thực hành khuyến nghị
- Ghi và enqueue outbox trong cùng transaction nghiệp vụ.
- Đặt `consumerName` cố định và `idempotent: true` khi subscribe.
- Handler nên idempotent: upsert, delete-ignore-missing, guard bằng business key.
- Giám sát `outbox_events` và `message_consumptions`; có thể bổ sung alert nếu `failed` vượt ngưỡng.
