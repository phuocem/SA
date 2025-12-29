# Seeded Admin Account

When the database has no users, the seed script creates a default admin user.

- Email: admin@campushub.local
- Password: CampusHub!234
- Role: admin

Notes:
- Password is stored hashed (bcrypt, 10 rounds) in the database.
- If any user already exists, the seed skips creating this account.
- Seed script: prisma/seed.ts
- Run: `npx prisma db seed` (or your project’s seed command). Ensure `DATABASE_URL` is set.
