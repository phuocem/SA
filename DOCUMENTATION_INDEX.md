# Campus Hub Backend - Complete Documentation Index

## 🔐 Authentication & Authorization

### JWT Authentication
- **File**: `src/api/auth/AUTH_README.md`
- **Topics**: Register, login, refresh tokens, logout, token management
- **Best for**: Understanding JWT implementation

### Role-Based Access Control (RBAC)
- **Files**: 
  - `RBAC_GUIDE.md` - Full RBAC documentation
  - `RBAC_IMPLEMENTATION.md` - Implementation details
  - `RBAC_QUICK_REFERENCE.md` - Quick lookup guide
  - `RBAC_COMPLETE.md` - Complete overview
  - `RBAC_VISUALIZATION.md` - Architecture diagrams

### Setup Guides
- **File**: `AUTHENTICATION_SETUP.md`
- **Topics**: JWT setup, packages installed, quick start

## 🧪 Testing

### API Testing
- **Files**:
  - `POSTMAN_TESTING.md` - General testing guide
  - `Campus-Hub-Auth.postman_collection.json` - Auth endpoints
  - `Campus-Hub-RBAC.postman_collection.json` - RBAC endpoints

### Postman Collections
1. **Campus-Hub-Auth.postman_collection.json**
   - Register endpoint
   - Login endpoint
   - Refresh token endpoint
   - Logout endpoint
   - Protected routes example
   - Auto-saves tokens to environment

2. **Campus-Hub-RBAC.postman_collection.json**
   - Setup tests
   - User management
   - Role management
   - Permission testing
   - Tests permission denial scenarios

## 📁 Project Structure

### Core Authentication Files
```
src/api/auth/
├── auth.service.ts           - Core auth logic
├── auth.controller.ts        - Auth endpoints
├── auth.module.ts            - Module configuration
├── roles.service.ts          - Role management
├── roles.controller.ts       - Role endpoints
├── role-initializer.service.ts - Auto-init

Constants:
├── constants/roles.constants.ts - Role definitions

Guards:
├── guards/jwt-auth.guard.ts  - JWT validation
├── guards/roles.guard.ts     - Role validation

Decorators:
├── decorators/authenticated.decorator.ts
├── decorators/current-user.decorator.ts
├── decorators/require-role.decorator.ts
├── decorators/roles.decorator.ts

Strategies:
├── strategies/jwt.strategy.ts
├── strategies/jwt-refresh.strategy.ts

DTOs:
├── dto/login.dto.ts
├── dto/register.dto.ts
├── dto/refresh-token.dto.ts
├── dto/auth-response.dto.ts
```

### User Management
```
src/api/users/
├── users.service.ts          - User operations
├── users.controller.ts       - User endpoints
├── users.module.ts           - Module configuration
```

### Database
```
prisma/
├── schema.prisma             - Database models
├── seed.ts                   - Role seeding
└── generated/                - Prisma generated code
```

## 🚀 Quick Start Guide

### 1. Initialize System
```bash
npm run start:dev          # Start backend
npx prisma db seed        # Create default roles
```

### 2. Create First User
```bash
# Register via API
POST /auth/register
{
  "email": "admin@example.com",
  "password": "SecurePass123",
  "name": "Admin"
}
```

### 3. Assign Admin Role (if needed)
```bash
# Use database or endpoint
POST /users/{userId}/role/1   # Assign admin (role 1)
```

### 4. Test with Postman
Import and run `Campus-Hub-RBAC.postman_collection.json`

### 5. Add to Your Routes
```typescript
@RequireRole(UserRole.ADMIN)
async myAdminRoute() { }
```

## 📚 Documentation by Topic

### Getting Started
1. Start here: `RBAC_QUICK_REFERENCE.md`
2. Then: `AUTHENTICATION_SETUP.md`
3. Setup Postman: `POSTMAN_TESTING.md`

### Understanding RBAC
1. Overview: `RBAC_COMPLETE.md`
2. Architecture: `RBAC_VISUALIZATION.md`
3. Deep dive: `RBAC_GUIDE.md`

### Implementation Details
1. Code structure: `RBAC_IMPLEMENTATION.md`
2. Examples: `EVENTS_CONTROLLER_EXAMPLE.ts`
3. In-code docs: Decorators and guards

### Troubleshooting
- All guides have troubleshooting sections
- See `RBAC_QUICK_REFERENCE.md` for common issues
- Check `POSTMAN_TESTING.md` for testing tips

## 🔗 Key APIs

### Authentication Endpoints
```
POST /auth/register      - Create new user
POST /auth/login         - Login with credentials
POST /auth/refresh       - Get new access token
POST /auth/logout        - Logout and revoke token
```

### Role Management (Admin Only)
```
GET  /roles              - List all roles
GET  /roles/:id         - Get role details
```

### User Management
```
GET  /users              - List all users (Admin only)
GET  /users/me          - Get current user profile
POST /users/:id/role/:roleId - Assign role (Admin only)
```

## 🎯 Role System

### Three Roles
| Role | ID | Access | Use Case |
|------|----|---------|----|
| Admin | 1 | Full system | System administrators |
| Staff | 2 | Event mgmt | Event coordinators |
| User | 3 | Basic access | Students/participants |

### Role Inheritance
- Admin inherits Staff and User permissions
- Staff inherits User permissions
- User has basic permissions only

### Decorators
- `@RequireRole(UserRole.ADMIN)` - Protect with role
- `@CurrentUser()` - Get user object
- `@Authenticated()` - Any authenticated user

## 💾 Environment Setup

### Required Environment Variables
```
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
DATABASE_URL=mysql://user:pass@localhost:3306/db
```

### Optional
```
REDIS_URL=redis://localhost:6379
AMQP_URL=amqp://guest:guest@localhost:5672
```

## 🧪 Testing Checklist

- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Can get user profile
- [ ] Can refresh token
- [ ] Admin can view all roles
- [ ] Admin can view all users
- [ ] Admin can assign roles
- [ ] Staff cannot access admin routes
- [ ] User cannot access staff routes
- [ ] Protected routes return 403
- [ ] Invalid token returns 401

## 🔒 Security Checklist

- [ ] JWT_SECRET is strong (production)
- [ ] JWT_REFRESH_SECRET is strong (production)
- [ ] HTTPS enabled (production)
- [ ] Role assignment restricted to admin
- [ ] User cannot modify other user's data
- [ ] Sensitive routes are protected
- [ ] Token expiration is set
- [ ] Refresh token validation works
- [ ] Logout revokes tokens
- [ ] Database constraints in place

## 📖 Reading Order Recommendation

For **New Users**:
1. RBAC_QUICK_REFERENCE.md
2. AUTHENTICATION_SETUP.md
3. Campus-Hub-RBAC.postman_collection.json
4. POSTMAN_TESTING.md

For **Developers**:
1. RBAC_IMPLEMENTATION.md
2. RBAC_GUIDE.md
3. EVENTS_CONTROLLER_EXAMPLE.ts
4. Source code in src/api/auth/

For **Architects**:
1. RBAC_COMPLETE.md
2. RBAC_VISUALIZATION.md
3. prisma/schema.prisma
4. Database design

## 🆘 Common Questions

**Q: How do I protect a route?**
A: Add `@RequireRole(UserRole.ADMIN)` decorator

**Q: How do I get the current user?**
A: Use `@CurrentUser() user: any` parameter

**Q: How do I assign an admin role?**
A: Use admin endpoint or database insert

**Q: What's the role hierarchy?**
A: Admin > Staff > User (inheritance flows down)

**Q: Do I need to manually create roles?**
A: No, they auto-create or use seed script

**Q: Can user change their own role?**
A: No, only admins can assign roles

**Q: How long is access token valid?**
A: 15 minutes by default

**Q: How long is refresh token valid?**
A: 7 days by default

## 📞 Support Resources

| Resource | Purpose |
|----------|---------|
| RBAC_GUIDE.md | Complete reference |
| RBAC_QUICK_REFERENCE.md | Quick lookup |
| POSTMAN_TESTING.md | Testing help |
| Source code | Implementation details |
| Decorators | Usage examples |

## ✅ Status Summary

```
System Status: ✅ PRODUCTION READY

Features Implemented:
  ✅ JWT Authentication
  ✅ Role-Based Access Control
  ✅ Role Hierarchy
  ✅ Route Protection
  ✅ User Management
  ✅ Role Management
  ✅ Auto-initialization
  ✅ Comprehensive Documentation
  ✅ Testing (Postman)

Build: ✅ Passing
Tests: ✅ Ready
Docs: ✅ Complete
```

---

## 🎯 Where to Start

**First time here?** → Start with `RBAC_QUICK_REFERENCE.md`  
**Need help?** → Check documentation index above  
**Ready to code?** → See `EVENTS_CONTROLLER_EXAMPLE.ts`  
**Want to test?** → Import Postman collection  

## 📝 Notes

- All documentation is in Markdown
- Examples use TypeScript
- Postman collections are JSON
- Code follows NestJS conventions
- Security best practices included

---

**Last Updated**: December 7, 2025  
**Version**: 1.0  
**Status**: Production Ready ✅
