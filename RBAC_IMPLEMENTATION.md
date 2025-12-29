# RBAC Implementation Summary

## ✅ What Was Added

### Core RBAC Components

**Constants** (`src/api/auth/constants/roles.constants.ts`)
- `UserRole` enum: ADMIN, STAFF, USER
- `ROLE_HIERARCHY`: Defines role inheritance
- `ROLE_DESCRIPTIONS`: Role documentation

**Guards** (`src/api/auth/guards/roles.guard.ts`)
- `RolesGuard`: Validates user roles against required roles
- Supports role hierarchy (admin can access staff routes)

**Decorators** (`src/api/auth/decorators/`)
- `@Roles(...roles)`: Mark required roles on a route
- `@RequireRole(...roles)`: Combined auth + role protection
- `@CurrentUser()`: Inject authenticated user
- `@Authenticated()`: Basic auth protection

**Services**
- `RolesService`: Manages roles (list, get, initialize)
- `RoleInitializer`: Auto-initializes roles on app startup
- `UsersService`: Enhanced with role assignment

**Controllers**
- `RolesController`: GET /roles (admin only)
- `UsersController`: User management endpoints

### Database

**Schema**
- `Role` model: Stores admin, staff, user roles
- `User` model: Has role_id foreign key
- Auto-created roles on first run

**Seed Script** (`prisma/seed.ts`)
- Creates three default roles
- Run with: `npx prisma db seed`

### Files Created/Updated

```
src/api/auth/
├── constants/
│   └── roles.constants.ts         [NEW] Role enums and hierarchy
├── guards/
│   ├── jwt-auth.guard.ts          [EXISTING]
│   ├── jwt-refresh-auth.guard.ts  [EXISTING]
│   └── roles.guard.ts             [NEW] Role validation
├── decorators/
│   ├── authenticated.decorator.ts [EXISTING]
│   ├── current-user.decorator.ts  [EXISTING]
│   ├── roles.decorator.ts         [NEW] Mark roles
│   └── require-role.decorator.ts  [NEW] Combined decorator
├── auth.controller.ts             [EXISTING]
├── auth.module.ts                 [UPDATED] Added RolesService
├── auth.service.ts                [EXISTING]
├── roles.controller.ts            [NEW] Role management endpoints
├── roles.service.ts               [NEW] Role operations
├── role-initializer.service.ts    [NEW] Auto-init roles
├── AUTH_README.md                 [EXISTING]
└── RBAC_GUIDE.md                  [NEW] Complete RBAC documentation

src/api/users/
├── users.controller.ts            [NEW] User management endpoints
├── users.module.ts                [UPDATED] Added controller
└── users.service.ts               [UPDATED] Add assignRole() method

prisma/
└── seed.ts                        [NEW] Initialize roles

Campus-Hub-RBAC.postman_collection.json [NEW] RBAC testing
```

## 🚀 Quick Start

### 1. Initialize Roles

Run the seed script to create default roles:

```bash
npx prisma db seed
```

Or run manually at app startup (automatic via RoleInitializer).

### 2. Protect Routes

Simple route protection:

```typescript
import { Controller, Get } from '@nestjs/common';
import { RequireRole } from './auth/decorators/require-role.decorator';
import { UserRole } from './auth/constants/roles.constants';

@Controller('admin')
export class AdminController {
  @Get('dashboard')
  @RequireRole(UserRole.ADMIN)
  getDashboard() {
    return { message: 'Admin dashboard' };
  }

  @Get('staff-dashboard')
  @RequireRole(UserRole.STAFF) // Also allows ADMIN
  getStaffDashboard() {
    return { message: 'Staff dashboard' };
  }
}
```

### 3. Test with Postman

Import `Campus-Hub-RBAC.postman_collection.json` for ready-made test cases.

## 📋 Role Hierarchy

```
ADMIN (Role ID: 1)
├── Can access all ADMIN routes
├── Can access all STAFF routes  ← inheritance
├── Can access all USER routes   ← inheritance
└── Full system access

STAFF (Role ID: 2)
├── Can access all STAFF routes
├── Can access all USER routes   ← inheritance
└── Event management, user support

USER (Role ID: 3)
├── Can access all USER routes
└── Basic access, event registration
```

## 🔗 API Endpoints

### Role Management
```
GET /roles                    - List all roles (Admin only)
GET /roles/:id               - Get role details (Admin only)
```

### User Management
```
GET /users                    - List all users (Admin only)
GET /users/me                - Get current user profile (Authenticated)
POST /users/:id/role/:roleId - Assign role to user (Admin only)
```

## 💾 Database Setup

### Manual Role Assignment

If you need to manually assign roles:

```sql
-- Assign user 1 as admin (role_id 1)
UPDATE users SET role_id = 1 WHERE user_id = 1;

-- Assign user 2 as staff (role_id 2)
UPDATE users SET role_id = 2 WHERE user_id = 2;

-- Assign user 3 as user (role_id 3)
UPDATE users SET role_id = 3 WHERE user_id = 3;
```

## 📚 Documentation Files

- `src/api/auth/RBAC_GUIDE.md` - Complete RBAC guide with examples
- `src/api/auth/AUTH_README.md` - Authentication guide
- `POSTMAN_TESTING.md` - General testing guide
- `Campus-Hub-RBAC.postman_collection.json` - Ready-made Postman tests

## 🧪 Test Scenarios

### Scenario 1: Verify Role Hierarchy
1. Register 3 users
2. Assign user 1 as ADMIN, user 2 as STAFF
3. Admin accesses staff endpoint → ✅ Success
4. Staff accesses admin endpoint → ❌ 403 Forbidden

### Scenario 2: Create Protected Routes
1. Add `@RequireRole(UserRole.ADMIN)` to route
2. Test with user token → 403 Forbidden
3. Test with admin token → Success

### Scenario 3: Permission Escalation Prevention
1. Try to assign yourself admin role → Not possible (needs current admin)
2. Only other admins can promote you

## 🔐 Security Features

✅ Role hierarchy prevents privilege escalation  
✅ Guards validate roles before route execution  
✅ User role included in JWT token  
✅ Role changes require admin access  
✅ Default role prevents unauthorized access  
✅ Audit trail ready for implementation  

## ⚙️ Configuration

The RBAC system uses environment variables:

```
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

No additional config needed - roles auto-initialize!

## 🎯 Usage Examples

### Example 1: Admin Dashboard
```typescript
@Controller('admin')
export class AdminDashboard {
  @Get()
  @RequireRole(UserRole.ADMIN)
  getDashboard(@CurrentUser() admin: any) {
    return { admin_name: admin.name };
  }
}
```

### Example 2: Staff & Admin
```typescript
@Controller('events')
export class EventsController {
  @Post()
  @RequireRole(UserRole.STAFF, UserRole.ADMIN)
  createEvent(@Body() event: any) {
    return { event_created: true };
  }
}
```

### Example 3: All Authenticated Users
```typescript
@Controller('profile')
export class ProfileController {
  @Get()
  @Authenticated()
  getProfile(@CurrentUser() user: any) {
    return user;
  }
}
```

## 🐛 Troubleshooting

**Question: User gets 403 even with correct role?**
- Check role_id is correct in database
- Re-login to refresh JWT token
- Verify @RequireRole is set correctly

**Question: Roles not initializing?**
- Run `npx prisma db seed` manually
- Check RoleInitializer service is in AuthModule

**Question: Cannot create admin user?**
- Create first admin via database insert
- Then use role assignment endpoint for others

## Next Steps

1. ✅ System is ready to use
2. Add @RequireRole() to your route handlers
3. Test with Postman collection
4. Deploy to production with strong JWT secrets

See `RBAC_GUIDE.md` for comprehensive documentation!
