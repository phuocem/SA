# Kế hoạch Caching

## Cache Keys & TTL
- Danh sách sự kiện: `events:list:<page>:<size>:<keyword>` — TTL 120s (xóa khi create/update/delete)
- Chi tiết sự kiện: `events:<id>` — TTL 300s (xóa khi update/delete)
- Danh sách đăng ký sự kiện: `events:<id>:registrations` — TTL 60s (xóa khi có thay đổi đăng ký)
- Danh sách role: `roles:all` — TTL 600s (xóa khi đổi role)
- Chi tiết role: `roles:<id>` — TTL 600s (xóa khi đổi role)
- Hồ sơ người dùng: `users:me:<userId>` — TTL 120s (xóa khi cập nhật hồ sơ)

## Chiến lược xóa cache
- Khi tạo/cập nhật/xóa sự kiện:
  - `del events:<id>` (nếu có)
  - `del events:<id>:registrations`
  - `delPattern events:list:*`
- Khi thay đổi đăng ký:
  - `del events:<eventId>:registrations`
- Khi thay đổi role (seed/admin):
  - `del roles:all`
  - `del roles:<id>`
- Khi cập nhật hồ sơ người dùng:
  - `del users:me:<userId>`

## HTTP Caching
- Interceptor thêm ETag + Cache-Control.
- Mặc định (ví dụ):
  - `/events` → `public, max-age=300`
  - `/roles` → `public, max-age=600`
  - `/users/me` → `no-cache, no-store` (@NoCache)
- Trả 304 khi `If-None-Match` khớp ETag trên server.

## Ghi chú
- Cache store: in-memory (cache-manager). Có thể cấu hình Redis nếu cần.
- Xóa theo pattern trong in-memory chỉ best-effort; production nên dùng key cụ thể hoặc SCAN cẩn trọng với Redis.
- Hạn chế `delPattern` rộng trên Redis production; ưu tiên key cụ thể.
