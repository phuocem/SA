# Tài khoản admin seed sẵn

Khi database chưa có user, script seed sẽ tạo sẵn một admin mặc định.

- Email: admin@campushub.local
- Mật khẩu: CampusHub!234
- Role: admin

Ghi chú:
- Mật khẩu lưu dạng hash (bcrypt, 10 rounds).
- Nếu đã có user, seed sẽ bỏ qua không tạo nữa.
- Script seed: `prisma/seed.ts`
- Chạy: `npx prisma db seed` (hoặc lệnh seed của dự án); nhớ cấu hình `DATABASE_URL`.
