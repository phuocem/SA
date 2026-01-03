# Demo Guide (Campus Hub Backend)

## 0) Chuẩn bị
- Base URL: `http://localhost:3000/v1` (Swagger: `/api`).
- Admin seed: email `admin@campushub.local`, password `CampusHub!234` (đã hash). Nếu DB trống, chạy `npx prisma db seed`.
- Env chính: JWT_SECRET/REFRESH_SECRET, DATABASE_URL, `RABBITMQ_ENABLED=true`, `RABBITMQ_URL=amqp://guest:guest@localhost:5672`.
- RabbitMQ: `docker run -d --name rabbit -p 5672:5672 -p 15672:15672 rabbitmq:3-management` (UI: :15672, guest/guest).

## 1) Auth nhanh
- Đăng ký: POST `/auth/register` body `{ email, password, name }`.
- Đăng nhập: POST `/auth/login` -> lấy `access_token`, `refresh_token`.
- Các API cần Bearer: Users/Roles/Cache, create/update/delete Events, Registrations.

## 2) Sự kiện (Events)
- Tạo event (cần token): POST `/events` body tối thiểu `{ name, start_time, end_time }` -> outbox publish `event.created`.
- Cập nhật: PUT `/events/:id` -> `event.updated`.
- Xoá (idempotent): DELETE `/events/:id` -> `event.deleted` (nếu đã xoá sẽ trả message, không lỗi).
- Lấy danh sách tìm kiếm: GET `/events/keyword?page=1&size=10&keyword=meetup` (cache 120s, MISS -> HIT lần 2).
- Lấy chi tiết: GET `/events/:id` (cache 300s).

## 3) Đăng ký sự kiện (Registrations)
- Đăng ký: POST `/events/:eventId/register` (Bearer) -> outbox publish `registration.created`.
- Huỷ: DELETE `/events/:eventId/register` -> `registration.cancelled`.
- Cache registrations của event invalidated sau mỗi thay đổi.

## 4) Người dùng & vai trò
- GET `/users` (ADMIN) xem danh sách.
- GET `/users/me` (Bearer) xem profile hiện tại.
- POST `/users/:id/role` (ADMIN) gán role.
- Roles cache 10 phút, có endpoint clear.

## 5) Cache vận hành
- MISS/HIT xem log `CacheService`. TTL (ms): list 120000, detail 300000, registrations 60000, roles 600000.
- Admin tools: `GET /cache/stats`, `POST /cache/reset`, `POST /cache/events/clear`, `POST /cache/roles/clear` (Bearer admin; events/clear cho staff/admin).

## 6) RabbitMQ / Outbox
- Outbox ghi sự kiện vào DB; OutboxProcessor publish lên exchange `campus-hub.events`.
- Routing keys hiện có: `event.created|updated|deleted`, `registration.created|cancelled`.
- RabbitMQService giữ 1 connection/channel, queue bền `ch-{consumerName}` để tránh tạo queue mới.
- Demo consumer (nếu bật) log message nhận: xem log `RabbitMQConsumer`.

## 7) Quy trình demo gợi ý (5–7 phút)
1) Login bằng admin seed (hoặc register + login) -> lấy token.
2) Tạo event (POST /events) -> cho thấy log outbox publish + RabbitMQ consumer nhận.
3) Gọi GET /events/keyword 2 lần liên tiếp -> log MISS rồi HIT.
4) Đăng ký sự kiện (POST /events/:id/register) -> log outbox `registration.created`.
5) Huỷ đăng ký -> log `registration.cancelled`.
6) Xem cache stats (admin) và thử `POST /cache/reset`.

## 8) Script thuyết trình (chi tiết 7–8 phút)
- 0:00 Mở đầu: “Đây là Campus Hub Backend: NestJS + Prisma/MySQL, auth JWT, cache có TTL, outbox đẩy sự kiện qua RabbitMQ.” Nhắc luôn Base URL, Swagger ở /api, và RabbitMQ container đã chạy.
- 0:30 Kiểm tra sẵn sàng: mở nhanh Swagger, chỉ vào seed admin `admin@campushub.local`. Nhấn env RABBITMQ_ENABLED=true, exchange `campus-hub.events`.
- 1:00 Auth: gọi POST /auth/login với admin seed, hiển thị access_token. Nói mọi thao tác write cần Bearer.
- 1:30 Events: tạo event qua POST /events. Vừa tạo xong nói rõ “Outbox ghi event.created rồi publish lên exchange; consumer sẽ log lại”. Nếu có log, show ngay. Nhắc cập nhật/xoá cũng phát `event.updated/deleted`, xoá idempotent.
- 2:30 Cache minh họa: gọi GET /events/keyword lần 1 (MISS), lần 2 (HIT) với cùng query. Nói TTL list 120s, detail 300s, roles 10 phút. Chỉ ra log CacheService.
- 3:30 RabbitMQ spotlight: giải thích routing keys event.* và registration.*; queue bền `ch-{consumerName}` để không tạo queue mới mỗi lần subscribe. Nếu có consumer bật, chỉ vào log nhận message.
- 4:15 Registrations: đăng ký qua POST /events/:id/register, nói publish `registration.created` và cache registrations bị clear. Huỷ đăng ký, thấy `registration.cancelled`.
- 5:15 Admin/cache tools: mở GET /cache/stats để thấy hit/miss; thử POST /cache/reset để chứng minh control layer.
- 6:00 Test/quality: nhắc đã có `npm run test`, `npm run test:e2e`, `npm run test:cov`; trong demo không chạy lâu, nhưng cho thấy lệnh và coverage report có spec cache/outbox.
- 6:45 Kết: tóm lại hệ thống có cache để giảm tải, outbox + RabbitMQ để tích hợp async, thao tác demo đã minh chứng cả hai. Mời Q&A.

## 9) Test & coverage nhanh
- Unit: `npm run test` (mock RabbitMQ, kiểm tra cache HIT/MISS logic và outbox publish).
- E2E: `npm run test:e2e` (có thể bật `RABBITMQ_ENABLED=true` trên staging để thấy queue nhận message thực).
- Coverage: `npm run test:cov` (mở coverage-report để xem các spec sự kiện/đăng ký và cache).

## 10) Troubleshoot nhanh
- RabbitMQ disabled/pending: kiểm tra env RABBITMQ_ENABLED, container đang chạy.
- Cache luôn MISS: kiểm tra server có restart (in-memory mất), query params phải giống; dùng Redis nếu cần chia sẻ.
- P2025 khi xoá event: đã idempotent, nếu vẫn lỗi thì DB không khớp, cần kiểm tra.

Tham chiếu thêm: [docs/cache-usage.md](cache-usage.md), [docs/rabbitmq-guide.md](rabbitmq-guide.md), [docs/api-endpoints.md](api-endpoints.md).
