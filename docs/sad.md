# Tài liệu Kiến trúc Phần mềm (SAD) - Campus Hub Backend

## 1. Tổng quan
Campus Hub Backend dùng NestJS + Prisma, cung cấp xác thực, RBAC, sự kiện, đăng ký tham gia, cache, messaging và các tính năng tin cậy (outbox, idempotent consumer, saga). CSDL: MySQL. Cache: Redis (cache-manager). Messaging: RabbitMQ (tuỳ chọn, bật bằng biến môi trường).

## 2. Kiến trúc runtime
- REST/HTTP với tiền tố toàn cục `/v1`
- JWT + RBAC guard
- Swagger tại `/v1/api`
- Cache Redis cho luồng nóng (danh sách/chi tiết sự kiện, registrations)
- Messaging qua outbox (polling) -> RabbitMQ

## 3. Thành phần chính
- API modules: auth, users, events, registrations
- Hạ tầng: Prisma, cache, messaging (RabbitMQ, outbox, idempotency), saga helper
- Tài liệu: RBAC, hướng dẫn auth, testing, caching, outbox, saga

## 4. Dữ liệu
- Lược đồ MySQL trong `prisma/schema.prisma`
- Migration trong `prisma/migrations`
- Seed script ở `prisma/seed.ts`
- Bảng outbox và consumption cho độ tin cậy

## 5. Độ tin cậy & nhất quán
- Outbox với retry/backoff; message có `messageId` ổn định
- Bảng idempotency cho consumer tránh xử lý trùng
- Saga helper cho giao dịch nhiều bước kèm bù trừ
- Cache với TTL rõ ràng và xoá cache trong service

## 6. Bảo mật
- JWT access/refresh, bcrypt hash mật khẩu
- RBAC với phân cấp role và guard
- Khuyến nghị HTTPS sản xuất; bí mật qua biến môi trường

## 7. Quan sát & vận hành
- Log qua Nest logger
- Kiểm tra outbox bằng truy vấn DB (xem docs/outbox.md)
- Pending/failed message có thể retry bằng cách chỉnh status/attempts

## 8. Triển khai
- Build: `npm run build`
- Run: `npm run start:dev` (hoặc `start:prod` với mã build)
- Migrate: `npx prisma migrate deploy`; generate client: `npx prisma generate`
- Feature flags: `RABBITMQ_ENABLED`, `OUTBOX_PROCESSOR_ENABLED`

## 9. Ràng buộc & giả định
- Một service, không tách microservice
- RabbitMQ tuỳ chọn; tắt thì outbox sẽ chờ pending
- Redis sẵn cho cache; tắt thì degrade nhẹ

## 10. Tham chiếu
- Outbox: `docs/outbox.md`
- Saga: `docs/saga.md`
- Cache: `docs/caching-plan.md`
- RBAC: `RBAC_COMPLETE.md`, `RBAC_COMPLETE_SUMMARY.md`
- Auth setup: `AUTHENTICATION_SETUP.md`
