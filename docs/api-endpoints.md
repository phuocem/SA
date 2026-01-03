# Danh sách Endpoint (v1)

> Base URL: `/v1` (Nest versioning URI). Swagger UI: `/api`. Các endpoint có `ApiBearerAuth` yêu cầu header `Authorization: Bearer <access_token>`. Vai trò hợp lệ: `admin`, `staff`, `user`.

## Ghi chú bất đồng bộ

- Event tạo/sửa/xoá dùng outbox để phát sự kiện `event.created|updated|deleted`; việc tiêu thụ có thể trễ, nên downstream có độ trễ nhẹ.
- Một số dữ liệu bị cache (mục bên dưới) nên kết quả đọc có thể trễ tối đa TTL đã nêu.
- Giao dịch ghi sử dụng Prisma; các lỗi 409/403/404 có thể xuất hiện do kiểm tra trạng thái đồng thời (vd: đã đăng ký, trạng thái huỷ, quyền sở hữu).

## Bộ nhớ đệm (Cache)

- Cache dùng Redis (thông qua `CacheService`). TTL mặc định:
	- Danh sách sự kiện: 120 giây (`events:list:*`).
	- Chi tiết sự kiện: 300 giây (`events:{id}`).
	- Danh sách đăng ký theo sự kiện: 60 giây (`events:{id}:registrations`).
	- Sự kiện của chính user: 120 giây (`events:mine:{user_id}:...`).
	- Danh sách roles: 600 giây (`roles:all`) và từng role `roles:{id}`.
- Invalidate khi ghi:
	- Tạo/sửa/xoá sự kiện: xóa `events:list:*`, `events:mine:{creator}:*`, `events:{id}` và `events:{id}:registrations` khi phù hợp.
	- Đăng ký/huỷ đăng ký: xóa `events:{eventId}:registrations`.
- Công cụ xoá cache thủ công (Admin): xem nhóm endpoint Cache bên dưới.

## Auth

| Method & Path | Auth | Input | Output | HTTP codes |
| --- | --- | --- | --- | --- |
| POST /auth/register | Không | Body: `{ email, password, name }` | 201 + `{ access_token, refresh_token, user{ user_id, email, name, role{ role_id, name } } }` | 201 Created; 400 Email đã tồn tại/thiếu trường |
| POST /auth/login | Không | Body: `{ email, password }` | 201 + AuthResponse như trên | 201 Created; 401 Sai email/mật khẩu |
| POST /auth/refresh | Bearer (refresh token, guard JwtRefreshAuthGuard) | Header: `Authorization: Bearer <refresh_token>` | 201 + AuthResponse mới | 201 Created; 401 Refresh token sai/hết hạn |
| POST /auth/logout | Bearer (refresh token) | Body: `{ refresh_token }` | 201 + `{ message }` | 201 Created; 401 Refresh token sai/hết hạn |

## Users

| Method & Path | Auth | Input | Output | HTTP codes |
| --- | --- | --- | --- | --- |
| GET /users | Bearer (ADMIN) | - | 200 + danh sách user kèm role | 200 OK; 401 thiếu token; 403 không đủ quyền |
| GET /users/me | Bearer | - | 200 + `{ user_id, email, name, role, is_active, created_at }` | 200 OK; 401 thiếu/invalid token |
| POST /users/:id/role | Bearer (ADMIN) | Path: `id`; Body: `{ role: admin|staff|user }` | 200 + user sau khi gán role | 200 OK; 401; 403; 500 nếu role không tồn tại |

## Roles

| Method & Path | Auth | Input | Output | HTTP codes |
| --- | --- | --- | --- | --- |
| GET /roles | Bearer (ADMIN) | - | 200 + danh sách role kèm users | 200 OK; 401; 403 |
| GET /roles/:id | Bearer (ADMIN) | Path: `id` (number) | 200 + role kèm users (có thể null) | 200 OK; 401; 403 |

## Events

| Method & Path | Auth | Input | Output | HTTP codes |
| --- | --- | --- | --- | --- |
| GET /events/keyword | Không | Query: `page?`, `size?`, `keyword?` | 200 + `{ data, total, page, size }` | 200 OK; 400 nếu query không hợp lệ |
| GET /events/me | Bearer | Query: `page?`, `size?`, `keyword?` | 200 + `{ data, total, page, size }` (chỉ event do chính user tạo) | 200 OK; 401 |
| GET /events/me/all | Bearer | - | 200 + `{ data, total, page:1, size:total }` (all event của user) | 200 OK; 401 |
| GET /events | Không | - | 200 + `{ data, total, page:1, size:total }` (mọi event, không phân trang) | 200 OK |
| GET /events/:id | Không | Path: `id` | 200 + event detail kèm `status` (string) và `registrations[]` (user {name,email}) | 200 OK; 400 ID không phải số; 404 không tìm thấy |
| POST /events | Bearer | Body: `{ name*, start_time*, end_time*, description?, location?, capacity?, status? }` | 201 + event vừa tạo | 201 Created; 400 thiếu `name/start_time/end_time`; 401 |
| PUT /events/:id | Bearer | Path: `id`; Body: các trường event cập nhật | 200 + event sau cập nhật | 200 OK; 401; 403 nếu không phải chủ sự kiện; 404 nếu không tồn tại |
| DELETE /events/:id | Bearer | Path: `id` | 200 + `{ message }` | 200 OK; 401; 403 nếu không phải chủ sự kiện; 404 nếu không tồn tại |

## Registrations (đăng ký sự kiện)

| Method & Path | Auth | Input | Output | HTTP codes |
| --- | --- | --- | --- | --- |
| POST /events/:eventId/register | Bearer | Path: `eventId`; Body: optional (không dùng) | 201 + bản ghi registration `{ registration_id, event_id, user_id, status, qr_code, ... }` | 201 Created; 400 eventId không hợp lệ; 401; 404 event không tồn tại; 403 nếu chủ sự kiện tự đăng ký hoặc đã huỷ >=3 lần; 409 đã đăng ký |
| DELETE /events/:eventId/register | Bearer | Path: `eventId` | 200 + registration sau khi huỷ | 200 OK; 400 eventId không hợp lệ; 401; 404 chưa đăng ký; 409 trạng thái không phải `registered` |

## Cache (Admin tools)

| Method & Path | Auth | Input | Output | HTTP codes |
| --- | --- | --- | --- | --- |
| GET /cache/stats | Bearer (ADMIN) | - | 200 + thống kê cache (hit/miss/keys...) | 200 OK; 401; 403 |
| DELETE /cache/:key | Bearer (ADMIN) | Path: `key` | 200 + `{ message }` | 200 OK; 401; 403 |
| POST /cache/reset | Bearer (ADMIN) | - | 200 + `{ message }` | 200 OK; 401; 403 |
| POST /cache/events/clear | Bearer (ADMIN or STAFF) | - | 200 + `{ message }` | 200 OK; 401; 403 |
| POST /cache/roles/clear | Bearer (ADMIN) | - | 200 + `{ message }` | 200 OK; 401; 403 |

## Health

| Method & Path | Auth | Input | Output | HTTP codes |
| --- | --- | --- | --- | --- |
| GET / | Không | - | 200 + chuỗi từ `getHello()` | 200 OK |
