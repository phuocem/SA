# Checklist kiểm tra Bất đồng bộ & Bộ nhớ đệm

## 1) Bất đồng bộ (Outbox/Events)
- Đọc code: `outboxService.enqueue` trong `src/api/events/events.service.ts` (create/update/delete) để hiểu routingKey.
- Kiểm tra worker/consumer có chạy: xem service tiêu thụ outbox (nếu có repo riêng, xác nhận). Nếu không có, ghi chú rủi ro trễ.
- Test tạo/sửa/xoá sự kiện rồi kiểm tra bảng outbox (nếu có DB) hoặc log của consumer để đảm bảo message được pick-up.
- Xác minh idempotency/đảm bảo không phát trùng (nếu cần) và xử lý khi downstream lỗi.

## 2) Bộ nhớ đệm (Cache)
- TTL theo code: danh sách sự kiện 120s, chi tiết 300s, registrations 60s, roles 600s. Kiểm tra `CacheService.getOrSet` trong events/roles services.
- Invalidation:
  - Event create/update/delete: xóa `events:list:*`, `events:mine:{creator}:*`, `events:{id}`, `events:{id}:registrations`.
  - Registration create/cancel: xóa `events:{eventId}:registrations`.
- Endpoint admin để clear thủ công: `GET /cache/stats`, `DELETE /cache/:key`, `POST /cache/reset`, `POST /cache/events/clear`, `POST /cache/roles/clear` (Bearer admin/staff tuỳ endpoint).
- HTTP cache layer: `HttpCacheInterceptor` áp dụng ở `UsersController`, `RolesController`; dùng `@NoCache` cho dữ liệu user hiện tại.

## 3) Quy trình test nhanh
- Bật Redis và API. Đặt `JWT_SECRET`, `JWT_REFRESH_SECRET` (nếu cần).
- Tạo event (POST /events). Ghi nhận response.
- Gọi `GET /events/keyword` hai lần: lần 1 miss (kiểm tra log cache), lần 2 hit; sau đó `POST /cache/reset` (admin) và gọi lại để chắc reset hoạt động.
- Cập nhật hoặc xoá event: gọi lại `GET /events/:id` để chắc cache bị xoá và dữ liệu mới phản ánh.
- Đăng ký sự kiện: POST /events/:id/register rồi GET chi tiết để xem registrations; huỷ đăng ký để chắc cache registrations bị xóa.

## 4) Rủi ro cần lưu ý
- TTL ngắn nhưng vẫn có thể trả dữ liệu cũ trong vài chục giây sau cập nhật.
- Nếu outbox consumer không chạy, downstream sẽ không nhận sự kiện; cần healthcheck riêng.
- Migration cột `cancellation_count` trong registrations được thêm bằng lệnh động; cần bảo đảm migration chuẩn trong CI/CD.
