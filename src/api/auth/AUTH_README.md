# JWT Authentication Guide

## Overview
This backend implements JWT (JSON Web Token) based authentication with refresh token support using NestJS, Passport, and Prisma.

## Features
- User registration with password hashing (bcrypt)
- User login with JWT tokens
- Access token (15 minutes expiration)
- Refresh token (7 days expiration) stored in database
- Token revocation on logout
- Protected routes with `@Authenticated()` decorator
- Current user injection with `@CurrentUser()` decorator

## API Endpoints

### Register
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": {
      "role_id": 2,
      "name": "student"
    }
  }
}
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: (same as register)
```

### Refresh Token
```
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}

Response: (new tokens)
```

### Logout
```
POST /auth/logout
Authorization: Bearer <refresh_token>
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}

Response:
{
  "message": "Logged out successfully"
}
```

## Using Authentication in Controllers

### Protect a Route
```typescript
import { Controller, Get } from '@nestjs/common';
import { Authenticated } from './auth/decorators/authenticated.decorator';
import { CurrentUser } from './auth/decorators/current-user.decorator';

@Controller('profile')
export class ProfileController {
  @Get()
  @Authenticated()
  getProfile(@CurrentUser() user: any) {
    return { user_id: user.user_id, email: user.email };
  }
}
```

## Environment Variables
Create a `.env` file with:
```
JWT_SECRET=your-super-secret-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
DATABASE_URL=mysql://user:password@localhost:3306/campus_hub
```

## Security Considerations
1. Always set strong, unique JWT secrets in production
2. Use HTTPS in production
3. Store refresh tokens securely (already hashed in database)
4. Implement rate limiting for auth endpoints
5. Consider adding CSRF protection
6. Use environment variables for sensitive data
7. Implement token blacklist or expiration for logout
