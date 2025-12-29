# RBAC System - Quick Reference

## ✨ Features Implemented

### 3-Tier Role System
- **Admin** (ID: 1) - Full system access, user management
- **Staff** (ID: 2) - Event management, user support
- **User** (ID: 3) - Basic access, event registration

### Automatic Role Initialization
- Roles created on first app startup
- Or manually with: `npx prisma db seed`

### Route Protection Decorators
- `@RequireRole(UserRole.ADMIN)` - Protect specific routes
- `@Authenticated()` - Any logged-in user
- `@CurrentUser()` - Get user object in handler
- `@Roles()` - Manual role marking

### Role Hierarchy
- Admin can access admin, staff, and user routes
- Staff can access staff and user routes
- User can access user routes only

## 🎯 Common Usage Patterns

### Pattern 1: Admin-Only Route
```typescript
@Get('admin/dashboard')
@RequireRole(UserRole.ADMIN)
adminDashboard(@CurrentUser() user: any) {
  return { message: `Welcome Admin ${user.name}` };
}
```

### Pattern 2: Staff and Admin
```typescript
@Post('events')
@RequireRole(UserRole.STAFF, UserRole.ADMIN)
createEvent(@Body() event: any) {
  return { created: true };
}
```

### Pattern 3: All Authenticated
```typescript
@Get('profile')
@Authenticated()
getProfile(@CurrentUser() user: any) {
  return user;
}
```

### Pattern 4: Role-Based Logic
```typescript
@Post('events/:id')
@RequireRole(UserRole.STAFF, UserRole.ADMIN)
updateEvent(@Param('id') id: string, @CurrentUser() user: any) {
  // Check if user is owner or admin
  if (user.role.name !== 'admin' && event.created_by !== user.user_id) {
    throw new ForbiddenException();
  }
  return this.eventsService.update(id, {...});
}
```

## 📡 API Endpoints

### Authentication
```
POST /auth/register     - Create account (User role by default)
POST /auth/login        - Login
POST /auth/refresh      - Refresh token
POST /auth/logout       - Logout
```

### Role Management (Admin)
```
GET /roles              - List all roles
GET /roles/:id         - Get role details
```

### User Management (Admin)
```
GET /users              - List all users
GET /users/me          - Get current user
POST /users/:id/role/:roleId - Assign role
```

## 🧪 Testing Steps

### Step 1: Start Backend
```bash
npm run start:dev
```

### Step 2: Initialize Roles (First Time)
```bash
npx prisma db seed
```

### Step 3: Test with Postman
Import `Campus-Hub-RBAC.postman_collection.json` and run:
1. Register 3 users (admin, staff, user)
2. Try accessing admin endpoints with each role
3. Observe 403 Forbidden for unauthorized users

### Step 4: Assign Roles (If Needed)
```
POST /users/2/role/1  # Make user 2 an admin
```

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `src/api/auth/constants/roles.constants.ts` | Role enums and hierarchy |
| `src/api/auth/guards/roles.guard.ts` | Role validation logic |
| `src/api/auth/decorators/require-role.decorator.ts` | @RequireRole() decorator |
| `src/api/auth/roles.service.ts` | Role management service |
| `src/api/auth/roles.controller.ts` | Role API endpoints |
| `src/api/auth/role-initializer.service.ts` | Auto-init service |
| `src/api/users/users.controller.ts` | User management endpoints |
| `prisma/seed.ts` | Database role seeding |
| `src/api/auth/RBAC_GUIDE.md` | Full documentation |

## 🚀 Applying to Existing Routes

### Events Module Example

**Before:**
```typescript
@Controller('events')
export class EventsController {
  @Get()
  getAllEvents() { }

  @Post()
  createEvent(@Body() dto: any) { }
}
```

**After:**
```typescript
@Controller('events')
export class EventsController {
  @Get()
  getAllEvents() { } // Public, no decorator needed

  @Post()
  @RequireRole(UserRole.STAFF, UserRole.ADMIN)
  createEvent(@CurrentUser() creator: any, @Body() dto: any) {
    // Only staff and admin can create
  }

  @Post(':id')
  @RequireRole(UserRole.ADMIN)
  deleteEvent(@Param('id') id: string) {
    // Only admin can delete
  }
}
```

## 🔐 Security Checklist

- [ ] Strong JWT_SECRET in .env (production)
- [ ] First admin created manually or via seed
- [ ] Role assignment restricted to admins
- [ ] Sensitive routes protected with @RequireRole
- [ ] User can only modify own data (unless admin)
- [ ] Audit logging implemented (optional)
- [ ] HTTPS in production

## 📊 Role Permission Matrix

| Endpoint | Admin | Staff | User | Notes |
|----------|-------|-------|------|-------|
| GET /roles | ✅ | ❌ | ❌ | List all roles |
| GET /users | ✅ | ❌ | ❌ | List all users |
| GET /users/me | ✅ | ✅ | ✅ | Own profile |
| POST /events | ✅ | ✅ | ❌ | Create event |
| POST /users/:id/role | ✅ | ❌ | ❌ | Assign role |

## 💡 Tips

1. **Roles auto-initialize** - No manual setup needed on first run
2. **Role hierarchy** - Admin automatically inherits staff permissions
3. **Multiple decorators** - Use `@RequireRole(ADMIN, STAFF)` for multiple
4. **Get user** - Use `@CurrentUser()` in any protected route
5. **Check role** - Access role via `@CurrentUser() user` then `user.role.name`

## 📝 Environment Setup

Create `.env` with:
```
JWT_SECRET=choose-a-strong-secret-for-production
JWT_REFRESH_SECRET=choose-another-strong-secret
DATABASE_URL=mysql://user:password@localhost:3306/campus_hub
```

## 🎓 Learning Path

1. Read `RBAC_GUIDE.md` for comprehensive guide
2. Review `roles.constants.ts` to understand hierarchy
3. Check `RolesGuard` implementation for validation logic
4. Test with `Campus-Hub-RBAC.postman_collection.json`
5. Apply `@RequireRole()` to your route handlers
6. Verify with Postman tests

## ✅ What's Ready

- [x] Role system with 3 tiers
- [x] Automatic role initialization
- [x] Route protection decorators
- [x] Role hierarchy enforcement
- [x] User management endpoints
- [x] Role management API
- [x] Postman collection for testing
- [x] Comprehensive documentation
- [x] Example implementations
- [x] Database seed script

## 🎯 Next: Apply to Your Modules

Now that RBAC is set up, add `@RequireRole()` to your:
- Events controller
- Registrations controller
- Any admin endpoints
- Any staff-only endpoints

See `EVENTS_CONTROLLER_EXAMPLE.ts` for reference!
