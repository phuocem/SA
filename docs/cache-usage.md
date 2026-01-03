# Hướng dẫn sử dụng Cache & HTTP Cache

## TTL và phạm vi
- Default cache (memory/Redis thông qua cache-manager): TTL 300s (5 phút) trong `CacheModule`.
- Events service: danh sách 120s, chi tiết 300s, registrations 60s, sự kiện của user 120s.
- Roles service: 600s.
- Lưu ý: TTL tính theo giây (đã chỉnh), cần restart server sau khi đổi.

## Invalidation dữ liệu ứng dụng
- Tạo/Sửa/Xoá sự kiện: xoá `events:list:*`, `events:mine:{creator}:*`, `events:{id}`, `events:{id}:registrations`.
- Đăng ký/Huỷ đăng ký: xoá `events:{eventId}:registrations`.
- Roles: không có invalidation tự động ngoài endpoint clear.

## Endpoint quản trị cache (Bearer admin, trừ events/clear cho staff)
- `GET /v1/cache/stats` — xem keys/count (có thể rỗng nếu store không hỗ trợ keys()).
- `DELETE /v1/cache/:key` — xoá một key.
- `POST /v1/cache/reset` — xoá toàn bộ.
- `POST /v1/cache/events/clear` — xoá mọi key bắt đầu `events:*` (admin/staff).
- `POST /v1/cache/roles/clear` — xoá roles cache.

## Kiểm thử MISS/HIT nhanh
- Không cần token: `curl "http://localhost:3000/v1/events/keyword?page=1&size=2"` gọi 2 lần; lần 1 MISS, lần 2 HIT (xem log CacheService).
- Chi tiết event: `curl "http://localhost:3000/v1/events/1"` 2 lần để thấy MISS → HIT.
- Sau TTL (120s/300s/60s) gọi lại sẽ MISS và nạp DB rồi set cache.

## HTTP Cache (ETag/Cache-Control)
- `HttpCacheInterceptor` tự gán ETag và Cache-Control cho GET; nếu `If-None-Match` khớp, trả 304 và không gửi body.
- `@NoCache()` trên handler để ép no-store (dùng cho dữ liệu user hiện tại). `@HttpCache(maxAge, isPrivate?)` để tuỳ chỉnh.
- Mặc định: `/events` public max-age 300; `/roles` public 600; `/registrations` public 60; `/users/me` & `/auth` no-store.

## Lưu ý vận hành
- Với Redis, `GET /cache/stats` có thể không liệt kê key nếu driver không hỗ trợ `keys()`. Dùng `SCAN 0 MATCH events:*` trên Redis CLI để kiểm tra.
- Nếu chạy nhiều instance và dùng in-memory store, cache không chia sẻ; nên dùng Redis trong production.
- Log sẽ báo `Cache HIT/MISS` giúp quan sát thực tế ngay cả khi stats rỗng.
