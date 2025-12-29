# Security Spec

## Authentication Flow
1. **Register**: `POST /auth/register` → create user, default role `user` (role_id=3).
2. **Login**: `POST /auth/login` → returns `access_token` (15m) and `refresh_token` (7d).
3. **Protected requests**: Send header `Authorization: Bearer <access_token>`.
4. **Refresh**: `POST /auth/refresh` with `refresh_token` to obtain new tokens (rotation).
5. **Logout**: `POST /auth/logout` invalidates refresh token.

## Roles
- `admin`: full access.
- `staff`: elevated access (manage events, view users).
- `user`: basic access.

Role hierarchy: `admin > staff > user` (inheritance).

## Protected Endpoints (examples)
- Admin only:
  - `GET /roles`
  - `GET /roles/:id`
  - `POST /users/:id/role`
  - `DELETE /events/:id`
  - `GET /cache/stats`, `DELETE /cache/:key`, `POST /cache/reset`, `POST /cache/roles/clear`
- Admin / Staff:
  - `GET /users`
  - `POST /events`, `PUT /events/:id`, `DELETE /events/:id`
  - `POST /cache/events/clear`
- Authenticated (any role):
  - `GET /users/me`
  - `GET /events`
  - `GET /events/:id`
  - `GET /events/:id/registrations`

## Guards & Decorators
- `JwtAuthGuard` for authentication.
- `@RequireRole(...)` with `RolesGuard` for authorization.
- `@NoCache()` to disable HTTP caching on sensitive endpoints.

## Tokens
- Access: short-lived (15 minutes), used for every request.
- Refresh: long-lived (7 days), stored server-side, rotated on refresh.

## Error Cases
- Missing/invalid token → 401.
- Insufficient role → 403.

## Storage
- Users and roles in MySQL via Prisma.
- Refresh tokens persisted (revoked on logout/rotation).
