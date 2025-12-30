# Runbook: Chạy và kiểm thử cục bộ

## 1) Chuẩn bị môi trường
- Node 18+ (khớp `package.json`).
- MySQL chạy sẵn và `DATABASE_URL` hợp lệ.
- Redis (tùy chọn, cho cache). Nếu không có, cache in-memory sẽ hoạt động.
- RabbitMQ (tùy chọn cho messaging/outbox). Nếu không dùng, đặt `RABBITMQ_ENABLED=false`.

## 2) Thiết lập biến môi trường
- Tối thiểu: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`.
- Messaging: `RABBITMQ_ENABLED=true`, `RABBITMQ_URL`, `RABBITMQ_EXCHANGE`.
- Outbox: `OUTBOX_PROCESSOR_ENABLED=true` (mặc định), `OUTBOX_POLL_INTERVAL_MS`, `OUTBOX_BATCH_SIZE`, `OUTBOX_MAX_ATTEMPTS`.
- Cache: `REDIS_URL` nếu muốn dùng Redis.

## 3) Cài đặt dependencies
```bash
npm install
```

## 4) Database
```bash
npx prisma migrate deploy   # áp dụng migration
npx prisma generate         # tạo Prisma Client
npx prisma db seed          # seed tài khoản mặc định
```

## 5) Chạy dịch vụ
```bash
npm run start:dev
```
- API base: `http://localhost:3000/v1`
- Swagger UI: `http://localhost:3000/api` (hiển thị các route /v1)
- Outbox processor chạy trong cùng tiến trình nếu `OUTBOX_PROCESSOR_ENABLED=true`.

## 6) Smoke test nhanh
```bash
# Build để chắc chắn biên dịch
npm run build

# Unit
npm test

# E2E (cần DB và env hợp lệ)
npm run test:e2e
```

### Login
```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"a@gmail.com","password":"123456"}'
```

### Outbox + messaging (nếu RabbitMQ bật)
1) Tạo sự kiện qua `/v1/events` (POST).
2) Kiểm tra bảng `outbox_events` có `status=published` và `messageId=outbox-{id}`.
3) Xem queue trên RabbitMQ UI hoặc log consumer để xác nhận nhận đủ một lần.

## 7) Gỡ lỗi nhanh
- 404 có `/v1/v1/...`: chỉ đặt một lần `/v1` trong URL.
- Không publish được message: chắc chắn broker chạy và `RABBITMQ_ENABLED=true`.
- Outbox pending mãi: kiểm tra poll interval/batch và `last_error` trong bảng outbox.
- Không kết nối DB: xác minh `DATABASE_URL` và quyền user MySQL.

## 8) Dừng
- `Ctrl+C` trong terminal đang chạy `npm run start:dev`.
