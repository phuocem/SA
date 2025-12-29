# Role-Based Access Control (RBAC) Guide

## Overview

This system implements a 3-tier role hierarchy:

| Role | Level | Permissions |
|------|-------|------------|
| **Admin** | 3 | Full system access, user management, role assignment |
| **Staff** | 2 | Event management, user support, registrations |
| **User** | 1 | Basic access, event registration, profile management |

## Role Hierarchy

- **Admin** inherits all permissions from Staff and User
- **Staff** inherits all permissions from User
- **User** has only basic permissions

## Available Roles

The system automatically creates three roles on startup:

1. **admin** (ID: 1) - Administrator with full system access
2. **staff** (ID: 2) - Staff member with event management access  
3. **user** (ID: 3) - Regular user with basic access

## Setup

### 1. Initialize Roles in Database

Run the seed script:

```bash
npx prisma db seed
```

Or manually run:

```bash
npm run prisma:seed
```

This will create the three default roles in your database.

### 2. Update package.json

The seed script is configured in `prisma/seed.ts`. Add this to your `package.json` if not already there:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

## Using RBAC in Routes

### Protect a Route with Role Requirement

Use the `@RequireRole()` decorator:

```typescript
import { Controller, Get } from '@nestjs/common';
import { RequireRole } from './auth/decorators/require-role.decorator';
import { CurrentUser } from './auth/decorators/current-user.decorator';
import { UserRole } from './auth/constants/roles.constants';

@Controller('admin')
export class AdminController {
  // Only admin can access
  @Get('users')
  @RequireRole(UserRole.ADMIN)
  getUsers() {
    return { users: [] };
  }

  // Multiple roles - staff OR admin
  @Get('events')
  @RequireRole(UserRole.STAFF, UserRole.ADMIN)
  getEvents() {
    return { events: [] };
  }

  // Get current user info
  @Get('me')
  @RequireRole(UserRole.USER)
  getProfile(@CurrentUser() user: any) {
    return user;
  }
}
```

### Available Decorators

#### `@RequireRole(...roles)`
Protects a route and checks if user has one of the specified roles.

```typescript
@RequireRole(UserRole.ADMIN)
@RequireRole(UserRole.ADMIN, UserRole.STAFF)
```

#### `@Authenticated()`
Protects a route - only checks if user is logged in, no role check.

```typescript
@Get()
@Authenticated()
getPublicData(@CurrentUser() user: any) {
  return user;
}
```

#### `@CurrentUser()`
Injects the current authenticated user into the handler.

```typescript
@Get('profile')
@RequireRole(UserRole.USER)
getProfile(@CurrentUser() user: any) {
  return user;
}
```

#### `@Roles(...roles)`
Manual role marking (used by RolesGuard). Usually use `@RequireRole` instead.

```typescript
@Roles(UserRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
adminOnly() {}
```

## API Endpoints for Role Management

### Get All Roles (Admin Only)
```
GET /roles
Authorization: Bearer <access_token>
```

Response:
```json
[
  {
    "role_id": 1,
    "name": "admin",
    "users": [...]
  },
  {
    "role_id": 2,
    "name": "staff",
    "users": [...]
  },
  {
    "role_id": 3,
    "name": "user",
    "users": [...]
  }
]
```

### Get Role by ID (Admin Only)
```
GET /roles/:id
Authorization: Bearer <access_token>
```

### Get All Users (Admin Only)
```
GET /users
Authorization: Bearer <access_token>
```

### Get Current User Profile
```
GET /users/me
Authorization: Bearer <access_token>
```

### Assign Role to User (Admin Only)
```
POST /users/:userId/role/:roleId
Authorization: Bearer <access_token>
```

Example:
```
POST /users/5/role/2
# Assigns user 5 to staff role (ID: 2)
```

## User Registration Default Role

When a user registers, they are assigned the **User** role (ID: 3) by default.

```typescript
// In auth.service.ts - register() method
const user = await this.usersService.create(
  registerDto.email,
  registerDto.password,
  registerDto.name,
  // roleId defaults to 3 (user)
);
```

To assign different roles, use the role assignment endpoint (admin only).

## Code Examples

### Example 1: Protect Admin Routes

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../auth/constants/roles.constants';

@Controller('admin')
export class AdminController {
  @Get('dashboard')
  @RequireRole(UserRole.ADMIN)
  getDashboard(@CurrentUser() admin: any) {
    return { message: `Welcome Admin ${admin.name}` };
  }

  @Post('promote-user')
  @RequireRole(UserRole.ADMIN)
  promoteUser(@Body() { userId, roleId }: any) {
    // Assign new role to user
    return { message: 'User promoted' };
  }
}
```

### Example 2: Protect Staff Routes

```typescript
@Controller('staff')
export class StaffController {
  @Get('events')
  @RequireRole(UserRole.STAFF) // Also allows ADMIN
  getEvents() {
    return { events: [] };
  }

  @Post('events')
  @RequireRole(UserRole.STAFF)
  createEvent(@Body() event: any) {
    return { message: 'Event created' };
  }
}
```

### Example 3: User Routes

```typescript
@Controller('profile')
export class ProfileController {
  @Get()
  @RequireRole(UserRole.USER) // Allows USER, STAFF, ADMIN
  getProfile(@CurrentUser() user: any) {
    return user;
  }

  @Post('register-event')
  @RequireRole(UserRole.USER)
  registerEvent(@CurrentUser() user: any, @Body() { eventId }: any) {
    return { message: 'Registered for event' };
  }
}
```

## Error Responses

### Unauthorized (401)
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Forbidden - Insufficient Role (403)
```json
{
  "statusCode": 403,
  "message": "Access denied. Required roles: admin, staff. User role: user"
}
```

### Not Found (404)
```json
{
  "statusCode": 404,
  "message": "Not Found"
}
```

## Testing with Postman

See `POSTMAN_TESTING.md` for Postman collection. When testing:

1. Register a user (gets USER role by default)
2. Try to access admin route → Get 403 Forbidden
3. Use another admin account or manually assign admin role
4. Try again → Success

## Role Assignment Flow

```
New User Registration
    ↓
Assigned USER role (ID: 3) by default
    ↓
Only Admin can promote to STAFF
    ↓
Only Admin can promote to ADMIN
```

## Security Considerations

✅ Role hierarchy prevents privilege escalation  
✅ Tokens include role information  
✅ Role changes take effect on next login  
✅ Admin-only operations are guarded  
✅ Cannot self-assign higher roles  

⚠️ **Important**: 
- First admin must be created manually or via database direct insert
- Change default registration role as needed for your use case
- Implement audit logging for role changes in production
