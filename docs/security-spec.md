# Đặc tả bảo mật

## Luồng xác thực
1. **Đăng ký**: `POST /auth/register` → tạo user, mặc định role `user` (role_id=3).
2. **Đăng nhập**: `POST /auth/login` → trả `access_token` (15 phút) và `refresh_token` (7 ngày).
3. **Gọi API bảo vệ**: gửi header `Authorization: Bearer <access_token>`.
4. **Làm mới**: `POST /auth/refresh` kèm `refresh_token` để nhận token mới (rotation).
5. **Đăng xuất**: `POST /auth/logout` thu hồi refresh token.

## Roles
- `admin`: toàn quyền.
- `staff`: quyền nâng cao (quản lý sự kiện, xem user).
- `user`: quyền cơ bản.

Thứ bậc: `admin > staff > user` (kế thừa xuống).

## Endpoint bảo vệ (ví dụ)
- Chỉ admin:
  - `GET /roles`
  - `GET /roles/:id`
  - `POST /users/:id/role`
  - `DELETE /events/:id`
  - `GET /cache/stats`, `DELETE /cache/:key`, `POST /cache/reset`, `POST /cache/roles/clear`
- Admin / Staff:
  - `GET /users`
  - `POST /events`, `PUT /events/:id`, `DELETE /events/:id`
  - `POST /cache/events/clear`
- Đã đăng nhập (mọi role):
  - `GET /users/me`
  - `GET /events`
  - `GET /events/:id`
  - `GET /events/:id/registrations`

## Guards & Decorator
- `JwtAuthGuard` cho xác thực.
- `@RequireRole(...)` + `RolesGuard` cho phân quyền.
- `@NoCache()` tắt HTTP caching ở endpoint nhạy cảm.

## Token
- Access: ngắn hạn (15 phút), gửi mỗi request.
- Refresh: dài hạn (7 ngày), lưu server-side, xoay vòng khi refresh.

## Lỗi thường gặp
- Thiếu/sai token → 401.
- Không đủ quyền → 403.

## Lưu trữ
- User và role trong MySQL qua Prisma.
- Refresh token lưu trong DB (thu hồi khi logout/rotation).
