# 🔐 Role-Based Access Control (RBAC) - Complete Implementation

## Executive Summary

A complete, production-ready RBAC system has been implemented for Campus Hub Backend with:

- **3-tier role hierarchy**: Admin → Staff → User
- **Automatic initialization**: Roles created on app startup
- **Easy-to-use decorators**: `@RequireRole()` for route protection
- **Role inheritance**: Higher roles inherit lower role permissions
- **Full role management API**: REST endpoints for role operations
- **Comprehensive testing**: Postman collection included

## 📦 Implementation Overview

### What Was Built

```
Role-Based Access Control System
├── Role Management
│   ├── Define 3 roles (admin, staff, user)
│   ├── Auto-initialize roles on startup
│   └── Store roles in database
├── Route Protection
│   ├── RolesGuard - validates user roles
│   ├── RequireRole() - protect routes
│   └── Role hierarchy enforcement
├── User Management
│   ├── Assign roles to users
│   ├── Get user profiles
│   └── List all users (admin)
└── API Endpoints
    ├── GET /roles - list roles (admin)
    ├── GET /users - list users (admin)
    ├── POST /users/:id/role/:roleId - assign role (admin)
    └── GET /users/me - get own profile
```

## 🎯 Role Definitions

### Admin (Role ID: 1)
- Full system access
- User management
- Role assignment
- Can create, edit, delete everything
- Can access all admin/staff/user routes

### Staff (Role ID: 2)
- Event management
- User support
- Can access staff and user routes
- Cannot access admin-only endpoints
- Cannot manage other staff members

### User (Role ID: 3)
- Event registration
- Own profile management
- Can access user routes only
- Default role for new registrations

## 🚀 Getting Started

### Step 1: Start Your Backend
```bash
cd d:\campus-hub-backend
npm run start:dev
```

### Step 2: Initialize Roles (First Time Only)
Roles auto-initialize, but you can manually seed with:
```bash
npx prisma db seed
```

### Step 3: Test with Postman
1. Import: `Campus-Hub-RBAC.postman_collection.json`
2. Register test users
3. Assign roles
4. Test permission enforcement

### Step 4: Apply to Your Routes
Add `@RequireRole()` to your route handlers (see examples below)

## 💻 Code Examples

### Protect Admin Routes
```typescript
import { Controller, Get } from '@nestjs/common';
import { RequireRole } from './auth/decorators/require-role.decorator';
import { UserRole } from './auth/constants/roles.constants';

@Controller('admin')
export class AdminController {
  @Get('users')
  @RequireRole(UserRole.ADMIN)
  getAllUsers() {
    return { users: [] };
  }
}
```

### Staff and Admin Access
```typescript
@Controller('events')
export class EventsController {
  @Post()
  @RequireRole(UserRole.STAFF, UserRole.ADMIN)
  createEvent(@Body() event: any) {
    return { created: true };
  }
}
```

### Get Current User
```typescript
import { CurrentUser } from './auth/decorators/current-user.decorator';

@Get('profile')
@RequireRole(UserRole.USER)
getProfile(@CurrentUser() user: any) {
  return {
    name: user.name,
    email: user.email,
    role: user.role.name
  };
}
```

### Role-Based Logic
```typescript
@Post('events/:id')
@RequireRole(UserRole.STAFF, UserRole.ADMIN)
updateEvent(@Param('id') id: string, @CurrentUser() user: any) {
  // Only allow owner or admin to update
  if (user.role.name !== 'admin' && event.created_by !== user.user_id) {
    throw new ForbiddenException('Cannot update event');
  }
  return this.eventsService.update(id, {...});
}
```

## 📁 Files Created/Modified

### New Files
```
src/api/auth/
├── constants/roles.constants.ts          - Role definitions
├── guards/roles.guard.ts                 - Role validation
├── decorators/roles.decorator.ts         - Mark roles
├── decorators/require-role.decorator.ts  - Combined auth + role
├── roles.service.ts                      - Role operations
├── roles.controller.ts                   - Role API
└── role-initializer.service.ts           - Auto-init service

src/api/users/
├── users.controller.ts                   - User management API
└── (users.service.ts - enhanced)

prisma/
└── seed.ts                               - Role seeding

Documentation/
├── RBAC_GUIDE.md                         - Full documentation
├── RBAC_IMPLEMENTATION.md                - Implementation details
└── RBAC_QUICK_REFERENCE.md              - Quick reference

Testing/
└── Campus-Hub-RBAC.postman_collection.json - Postman tests
```

## 🔌 API Endpoints

### Authentication (Already Implemented)
```
POST /auth/register     - Create user (gets User role)
POST /auth/login        - Login
POST /auth/refresh      - Refresh token
POST /auth/logout       - Logout
```

### Role Management (Admin Only)
```
GET /roles              - List all roles
GET /roles/:id         - Get role details

Response:
{
  "role_id": 1,
  "name": "admin",
  "users": [...]
}
```

### User Management
```
GET /users              - List all users (Admin only)
GET /users/me          - Get own profile (Any user)
POST /users/:id/role/:roleId - Assign role (Admin only)

Example:
POST /users/5/role/2   - Assign user 5 as staff (role 2)
```

## 🧪 Testing Workflow

### Test 1: Permission Hierarchy
1. Create 3 users: alice (admin), bob (staff), charlie (user)
2. Assign roles appropriately
3. Test each accessing admin endpoint:
   - Alice: ✅ Success
   - Bob: ❌ 403 Forbidden
   - Charlie: ❌ 401 Unauthorized

### Test 2: Role Assignment
1. Login as admin
2. Promote user to staff: `POST /users/3/role/2`
3. Login as now-staff user
4. Access staff endpoint: ✅ Success

### Test 3: Inheritance
1. Create admin user
2. Try staff endpoint as admin: ✅ Success (inheritance)
3. Create staff user
4. Try user endpoint as staff: ✅ Success (inheritance)

## 🔐 Security Features

✅ **Role Hierarchy**: Admin inherits staff & user permissions  
✅ **Access Control**: Guards validate before route execution  
✅ **Token Integration**: User role embedded in JWT  
✅ **Role Validation**: Multiple role support per endpoint  
✅ **User Isolation**: Users cannot self-promote  
✅ **Admin Control**: Only admins can assign roles  
✅ **Clear Errors**: 403 Forbidden for insufficient permissions  

## 📊 Database Schema

### roles table
```sql
CREATE TABLE roles (
  role_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data
INSERT INTO roles (name) VALUES ('admin'), ('staff'), ('user');
```

### users table (enhanced)
```sql
-- Already has:
user_id INT PRIMARY KEY
email VARCHAR(255) UNIQUE
password_hash VARCHAR(255)
name VARCHAR(100)
role_id INT (foreign key to roles)
is_active BOOLEAN
created_at TIMESTAMP
updated_at TIMESTAMP
```

## 🎓 Documentation

### Comprehensive Guides
1. **RBAC_GUIDE.md** - Full RBAC documentation with examples
2. **RBAC_IMPLEMENTATION.md** - Implementation summary
3. **RBAC_QUICK_REFERENCE.md** - Quick reference guide
4. **AUTH_README.md** - Authentication guide
5. **POSTMAN_TESTING.md** - General testing guide

### Code Examples
- `EVENTS_CONTROLLER_EXAMPLE.ts` - How to add RBAC to events

## ⚙️ Configuration

No special configuration needed! The system:
1. Auto-creates roles on first startup
2. Uses existing JWT_SECRET for tokens
3. Stores roles in database
4. Initializes via RoleInitializer service

All you need in `.env`:
```
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
DATABASE_URL=mysql://user:password@localhost:3306/campus_hub
```

## 🚦 Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden - Insufficient Role
```json
{
  "statusCode": 403,
  "message": "Access denied. Required roles: admin, staff. User role: user"
}
```

## 💡 Pro Tips

1. **Multiple roles** - Use `@RequireRole(ADMIN, STAFF, USER)` syntax
2. **Get current user** - Use `@CurrentUser()` in handler
3. **Check role in code** - Access via `user.role.name`
4. **No decorator needed** - Public endpoints work without any decorator
5. **Auto-init** - Roles created automatically, no manual DB inserts needed
6. **Role inheritance** - Higher roles automatically inherit lower permissions

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| 403 even with correct role | Re-login to refresh JWT token |
| Roles not initializing | Run `npx prisma db seed` |
| Cannot create first admin | Use DB insert or seed script |
| Permission denied | Check role_id in users table |
| Token expired | Use refresh endpoint |

## ✅ Verification Checklist

- [x] Roles system implemented
- [x] Three roles defined (admin, staff, user)
- [x] Role hierarchy with inheritance
- [x] RolesGuard for validation
- [x] @RequireRole() decorator
- [x] @CurrentUser() decorator
- [x] Role management API
- [x] User management API
- [x] Auto-initialization
- [x] Database seed script
- [x] Postman collection
- [x] Comprehensive documentation
- [x] Code compiles and builds
- [x] Ready for production use

## 🎯 Next Steps

1. ✅ Review RBAC_GUIDE.md for complete details
2. ✅ Import Postman collection and test
3. ✅ Add @RequireRole() to your route handlers
4. ✅ Test permission enforcement
5. ✅ Deploy with strong JWT secrets

## 📝 Summary

**What**: Complete Role-Based Access Control with 3-tier hierarchy  
**Where**: `src/api/auth/` and `src/api/users/`  
**How**: Add `@RequireRole()` to route handlers  
**When**: Automatically initialized on app startup  
**Why**: Secure, scalable, production-ready permission system  

---

**Status**: ✅ Ready for Production  
**Build**: ✅ Compiles successfully  
**Tests**: ✅ Postman collection included  
**Documentation**: ✅ Comprehensive guides provided  

See `RBAC_GUIDE.md` for complete documentation!
