# 🧪 Campus Hub Backend - Testing Guide

Hướng dẫn test toàn bộ chức năng đã implement:
- JWT Authentication
- Role-Based Access Control (RBAC)
- Server-Side Caching
- HTTP Caching (ETag & Cache-Control)

---

## 📋 **MỤC LỤC**

1. [Chuẩn bị](#1-chuẩn-bị)
2. [Test JWT Authentication](#2-test-jwt-authentication)
3. [Test RBAC (Role-Based Access Control)](#3-test-rbac-role-based-access-control)
4. [Test Server-Side Caching](#4-test-server-side-caching)
5. [Test HTTP Caching (ETag & Cache-Control)](#5-test-http-caching-etag--cache-control)
6. [Test Script Tự Động](#6-test-script-tự-động-postman)
7. [Test Performance](#7-test-performance-comparison)
8. [Verification Checklist](#8-verification-checklist)
9. [Logs để Monitor](#9-logs-để-monitor)

---

## **1. Chuẩn Bị**

### Start Server:
```bash
npm run start:dev
```

### Import Postman Collections:
- `Campus-Hub-Auth.postman_collection.json`
- `Campus-Hub-RBAC.postman_collection.json`

### Base URL:
```
http://localhost:3000
```

---

## **2. Test JWT Authentication**

### **A. Register User**

**Request:**
```http
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "Test123456",
  "name": "Test User"
}
```

**Expected Response (201):**
```json
{
  "user": {
    "id": 1,
    "email": "testuser@example.com",
    "name": "Test User",
    "role": "USER"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 900
}
```

✅ **Verify:**
- Status code: 201
- Nhận được access_token và refresh_token
- User được tạo trong database
- Password được hash (không lưu plain text)

---

### **B. Login**

**Request:**
```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "Test123456"
}
```

**Expected Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "testuser@example.com",
    "name": "Test User",
    "role": "USER"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 900
}
```

✅ **Verify:**
- Login thành công với đúng credentials
- Login thất bại với sai password (401)
- Nhận tokens mới

---

### **C. Get Profile (Protected Route)**

**Request:**
```http
GET http://localhost:3000/users/me
Authorization: Bearer {access_token}
```

**Expected Response (200):**
```json
{
  "id": 1,
  "email": "testuser@example.com",
  "name": "Test User",
  "role": "USER",
  "createdAt": "2025-12-07T10:00:00.000Z"
}
```

✅ **Verify:**
- Với valid token: 200 OK
- Không có token: 401 Unauthorized
- Token hết hạn: 401 Unauthorized
- Token invalid: 401 Unauthorized

---

### **D. Refresh Token**

**Request:**
```http
POST http://localhost:3000/auth/refresh
Content-Type: application/json

{
  "refresh_token": "{your_refresh_token}"
}
```

**Expected Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 900
}
```

✅ **Verify:**
- Nhận access_token mới
- Nhận refresh_token mới (rotation)
- Refresh token cũ bị revoke (không dùng được nữa)

---

### **E. Logout**

**Request:**
```http
POST http://localhost:3000/auth/logout
Authorization: Bearer {access_token}
```

**Expected Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

✅ **Verify:**
- Refresh token bị xóa khỏi database
- Không thể dùng refresh token cũ để renew
- Access token vẫn valid cho đến khi hết hạn (15 phút)

---

## **3. Test RBAC (Role-Based Access Control)**

### **Role Hierarchy:**
```
ADMIN > STAFF > USER
```

Admin có tất cả quyền của Staff và User  
Staff có tất cả quyền của User

---

### **A. Tạo Users với Roles Khác Nhau**

#### **1. Tạo Admin User:**

**Cách 1: Dùng SQL**
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

**Cách 2: Dùng API (cần admin token)**
```http
POST http://localhost:3000/users/{userId}/role
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "role": "ADMIN"
}
```

#### **2. Tạo Staff User:**
```http
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "staff@example.com",
  "password": "Staff123456",
  "name": "Staff User"
}
```

Sau đó assign role STAFF (cần admin token):
```http
POST http://localhost:3000/users/{staffUserId}/role
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "role": "STAFF"
}
```

---

### **B. Test Admin Routes**

Login as Admin và test các routes:

#### **List All Roles (Admin only)**
```http
GET http://localhost:3000/roles
Authorization: Bearer {admin_token}
```

**Expected (200):**
```json
[
  {
    "id": 1,
    "name": "ADMIN",
    "description": "Full system access",
    "level": 3
  },
  {
    "id": 2,
    "name": "STAFF",
    "description": "Staff member access",
    "level": 2
  },
  {
    "id": 3,
    "name": "USER",
    "description": "Basic user access",
    "level": 1
  }
]
```

✅ **Verify:**
- Admin: 200 OK
- Staff: 403 Forbidden
- User: 403 Forbidden

---

#### **List All Users (Admin/Staff)**
```http
GET http://localhost:3000/users
Authorization: Bearer {token}
```

✅ **Verify:**
- Admin: 200 OK ✅
- Staff: 200 OK ✅ (Staff có quyền vì role hierarchy)
- User: 403 Forbidden ❌

---

#### **Assign Role (Admin only)**
```http
POST http://localhost:3000/users/{userId}/role
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "role": "STAFF"
}
```

✅ **Verify:**
- Admin: 200 OK ✅
- Staff: 403 Forbidden ❌
- User: 403 Forbidden ❌

---

### **C. Test Staff Routes**

Login as Staff:

```http
# Staff có thể list users
GET http://localhost:3000/users
Authorization: Bearer {staff_token}
# => 200 OK ✅

# Staff KHÔNG thể list roles
GET http://localhost:3000/roles
Authorization: Bearer {staff_token}
# => 403 Forbidden ❌

# Staff có thể tạo events
POST http://localhost:3000/events
Authorization: Bearer {staff_token}
Content-Type: application/json
{
  "title": "Staff Event",
  "description": "Created by staff"
}
# => 201 Created ✅
```

---

### **D. Test User Routes**

Login as normal User:

```http
# User có thể xem own profile
GET http://localhost:3000/users/me
Authorization: Bearer {user_token}
# => 200 OK ✅

# User có thể xem events
GET http://localhost:3000/events
Authorization: Bearer {user_token}
# => 200 OK ✅

# User KHÔNG thể list all users
GET http://localhost:3000/users
Authorization: Bearer {user_token}
# => 403 Forbidden ❌

# User KHÔNG thể xem roles
GET http://localhost:3000/roles
Authorization: Bearer {user_token}
# => 403 Forbidden ❌
```

---

### **E. Test Permission Matrix**

| Endpoint | Admin | Staff | User | Public |
|----------|-------|-------|------|--------|
| `POST /auth/register` | ✅ | ✅ | ✅ | ✅ |
| `POST /auth/login` | ✅ | ✅ | ✅ | ✅ |
| `GET /users/me` | ✅ | ✅ | ✅ | ❌ |
| `GET /users` | ✅ | ✅ | ❌ | ❌ |
| `POST /users/{id}/role` | ✅ | ❌ | ❌ | ❌ |
| `GET /roles` | ✅ | ❌ | ❌ | ❌ |
| `GET /roles/{id}` | ✅ | ❌ | ❌ | ❌ |
| `GET /events` | ✅ | ✅ | ✅ | ❌ |
| `POST /events` | ✅ | ✅ | ❌ | ❌ |
| `DELETE /events/{id}` | ✅ | ✅ | ❌ | ❌ |
| `GET /cache/stats` | ✅ | ❌ | ❌ | ❌ |

---

## **4. Test Server-Side Caching**

### **A. Test Cache Hit/Miss**

#### **Request 1 - Cache MISS**
```http
GET http://localhost:3000/events
Authorization: Bearer {token}
```

**Check logs:**
```
[CacheService] Cache miss for key: events:all
[CacheService] Setting cache for key: events:all, TTL: 120
```

**Response time:** ~50-100ms (query database)

---

#### **Request 2 - Cache HIT**
```http
GET http://localhost:3000/events
Authorization: Bearer {token}
```

**Check logs:**
```
[CacheService] Cache hit for key: events:all
```

**Response time:** ~5-15ms (từ memory cache - nhanh hơn 10x!)

✅ **Verify:**
- Response giống hệt nhau
- Response time giảm đáng kể
- Không query database (check logs)

---

### **B. Test Cache Invalidation**

```http
# 1. Get events (tạo cache)
GET http://localhost:3000/events
Authorization: Bearer {token}
# => Cache được tạo

# 2. Create new event (cache bị xóa)
POST http://localhost:3000/events
Authorization: Bearer {admin_token}
Content-Type: application/json
{
  "title": "New Event",
  "description": "This should invalidate cache",
  "startDate": "2025-12-20T10:00:00Z",
  "endDate": "2025-12-20T12:00:00Z",
  "location": "Campus Hall"
}
# => Check logs: "Cache cleared for pattern: events:*"

# 3. Get events again (cache MISS - lấy data mới)
GET http://localhost:3000/events
Authorization: Bearer {token}
# => Sẽ thấy event mới vừa tạo
# => Cache miss vì đã bị invalidate
```

✅ **Verify:**
- Create/Update/Delete operations xóa cache
- Request tiếp theo là cache MISS
- Data mới được lấy từ database

---

### **C. Test Cache TTL (Time To Live)**

**Cache TTL đã configured:**
- Events list: **2 phút** (120 giây)
- Single event: **5 phút** (300 giây)
- Event registrations: **1 phút** (60 giây)
- Roles list: **10 phút** (600 giây)

**Test cache expiry:**
```http
# 1. Get events (cache được tạo)
GET http://localhost:3000/events

# 2. Wait 2 phút (cache hết hạn)
# Sleep 120 seconds...

# 3. Get events again (cache MISS - đã expire)
GET http://localhost:3000/events
# => Cache miss vì đã hết TTL
```

---

### **D. Test Cache Management API (Admin Only)**

#### **View Cache Stats**
```http
GET http://localhost:3000/cache/stats
Authorization: Bearer {admin_token}
```

**Expected Response:**
```json
{
  "keys": [
    "events:all",
    "events:1",
    "roles:all"
  ],
  "count": 3
}
```

---

#### **Clear Specific Cache**
```http
DELETE http://localhost:3000/cache/events:all
Authorization: Bearer {admin_token}
```

**Expected Response:**
```json
{
  "message": "Cache cleared for key: events:all"
}
```

---

#### **Clear All Cache**
```http
DELETE http://localhost:3000/cache
Authorization: Bearer {admin_token}
```

**Expected Response:**
```json
{
  "message": "All cache cleared"
}
```

✅ **Verify:**
- Chỉ Admin có thể access cache management
- Staff/User nhận 403 Forbidden
- Cache thực sự bị xóa (check với GET /cache/stats)

---

### **E. Test Cached Endpoints**

| Endpoint | Cache Key | TTL | Invalidation |
|----------|-----------|-----|--------------|
| `GET /events` | `events:all` | 2 min | `POST/PUT/DELETE /events` |
| `GET /events/{id}` | `events:{id}` | 5 min | `PUT/DELETE /events/{id}` |
| `GET /events/{id}/registrations` | `events:{id}:registrations` | 1 min | `POST /registrations` |
| `GET /roles` | `roles:all` | 10 min | Seed script |
| `GET /roles/{id}` | `roles:{id}` | 10 min | Seed script |

---

## **5. Test HTTP Caching (ETag & Cache-Control)**

### **A. Test ETag với Postman**

#### **Request 1 - Initial Request**
```http
GET http://localhost:3000/events
Authorization: Bearer {token}
```

**Response Headers:**
```
HTTP/1.1 200 OK
ETag: "abc123def456"
Cache-Control: public, max-age=300
Content-Type: application/json
```

**Response Body:** Full events data

---

#### **Request 2 - Conditional Request**
```http
GET http://localhost:3000/events
Authorization: Bearer {token}
If-None-Match: "abc123def456"
```

**Response:**
```
HTTP/1.1 304 Not Modified
ETag: "abc123def456"
```

**No body returned** - tiết kiệm bandwidth!

✅ **Verify:**
- Lần đầu: 200 OK với full body
- Lần sau (với If-None-Match): 304 Not Modified, no body
- ETag header có trong cả 2 responses

---

### **B. Test với PowerShell**

```powershell
# 1. First request - get ETag
$response = Invoke-WebRequest -Uri "http://localhost:3000/events" -Headers @{
    "Authorization" = "Bearer YOUR_TOKEN"
}

$etag = $response.Headers.ETag[0]
Write-Host "ETag: $etag"
Write-Host "Status: $($response.StatusCode)"
Write-Host "Content-Length: $($response.Content.Length)"

# 2. Second request - use ETag for conditional request
$headers = @{
    "Authorization" = "Bearer YOUR_TOKEN"
    "If-None-Match" = $etag
}

try {
    $response2 = Invoke-WebRequest -Uri "http://localhost:3000/events" -Headers $headers
    Write-Host "Status: $($response2.StatusCode)"
} catch {
    # 304 throws exception in PowerShell
    if ($_.Exception.Response.StatusCode -eq 304) {
        Write-Host "✅ 304 Not Modified - Cache working!"
    }
}
```

---

### **C. Test Cache-Control Headers**

Test các endpoints khác nhau có Cache-Control headers khác nhau:

#### **Public Endpoints:**
```http
GET http://localhost:3000/events
Authorization: Bearer {token}

Response Headers:
Cache-Control: public, max-age=300
```

```http
GET http://localhost:3000/roles
Authorization: Bearer {admin_token}

Response Headers:
Cache-Control: public, max-age=600
```

---

#### **Private Endpoints (with @NoCache()):**
```http
GET http://localhost:3000/users/me
Authorization: Bearer {token}

Response Headers:
Cache-Control: private, no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
```

✅ **Verify:**
- `/events`: `public, max-age=300` (5 phút)
- `/roles`: `public, max-age=600` (10 phút)
- `/users/me`: `no-cache, no-store` (không cache)

---

### **D. Test trong Browser DevTools**

1. Mở **Chrome DevTools** (F12)
2. Vào tab **Network**
3. Gọi API endpoint: `GET http://localhost:3000/events`
4. Xem request trong Network tab:

**First Request:**
```
Status: 200 OK
Size: 5.2 kB
Time: 85 ms
```

5. **Refresh** page (F5) hoặc gọi lại API

**Second Request:**
```
Status: 304 Not Modified
Size: 123 B (cached)
Time: 12 ms
```

6. Check **Headers** tab:
```
Request Headers:
  If-None-Match: "abc123def456"

Response Headers:
  Status: 304 Not Modified
  ETag: "abc123def456"
```

✅ **Verify:**
- Status code: 304
- Size giảm đáng kể (no body)
- Time nhanh hơn
- Browser tự động add If-None-Match header

---

### **E. Test ETag Invalidation**

```http
# 1. Get events (ETag = "abc123")
GET http://localhost:3000/events
# Response: ETag: "abc123"

# 2. Get again with If-None-Match
GET http://localhost:3000/events
If-None-Match: "abc123"
# Response: 304 Not Modified

# 3. Create new event (data changes)
POST http://localhost:3000/events
{
  "title": "New Event",
  "description": "This changes data"
}

# 4. Get events again with old ETag
GET http://localhost:3000/events
If-None-Match: "abc123"
# Response: 200 OK với ETag mới "xyz789"
# => ETag changed vì data đã thay đổi!
```

✅ **Verify:**
- Khi data thay đổi, ETag mới được generate
- Old ETag không match → trả về 200 OK với data mới
- Client nhận ETag mới để cache

---

## **6. Test Script Tự Động (Postman)**

### **A. Import Collections**

1. Mở Postman
2. Click **Import**
3. Import 2 files:
   - `Campus-Hub-Auth.postman_collection.json`
   - `Campus-Hub-RBAC.postman_collection.json`

---

### **B. Setup Environment (Optional)**

Tạo Postman Environment:

```json
{
  "name": "Campus Hub Dev",
  "values": [
    {
      "key": "base_url",
      "value": "http://localhost:3000",
      "enabled": true
    },
    {
      "key": "access_token",
      "value": "",
      "enabled": true
    },
    {
      "key": "refresh_token",
      "value": "",
      "enabled": true
    },
    {
      "key": "user_id",
      "value": "",
      "enabled": true
    }
  ]
}
```

---

### **C. Run Collection**

1. Click **Campus-Hub-Auth** collection
2. Click **Run** button (hoặc "..." → Run collection)
3. Select environment: **Campus Hub Dev**
4. Click **Run Campus-Hub-Auth**

Postman sẽ tự động chạy tất cả requests theo thứ tự:
- ✅ Register User
- ✅ Login
- ✅ Get Profile
- ✅ Refresh Token
- ✅ Logout

---

### **D. Collection Tests (Pre-configured)**

Mỗi request có tests tự động:

```javascript
// Register Test
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has access_token", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.access_token).to.exist;
});

// Login Test
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Save access_token to environment", function () {
    var jsonData = pm.response.json();
    pm.environment.set("access_token", jsonData.access_token);
});
```

✅ **Verify:**
- All tests pass (green checkmarks)
- Environment variables được set tự động
- Token được pass giữa các requests

---

## **7. Test Performance Comparison**

### **A. Performance Test Script (PowerShell)**

Save as `test-performance.ps1`:

```powershell
# Performance Test Script
$url = "http://localhost:3000/events"
$token = "YOUR_ACCESS_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
}

Write-Host "=== Performance Test ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Cache MISS (first call)
Write-Host "Test 1: Cache MISS (first request)" -ForegroundColor Yellow
$time1 = Measure-Command {
    $response1 = Invoke-RestMethod -Uri $url -Headers $headers -Method GET
}
Write-Host "Time: $($time1.TotalMilliseconds) ms" -ForegroundColor Green
Write-Host "Records: $($response1.Count)" -ForegroundColor Green
Write-Host ""

# Wait 1 second
Start-Sleep -Seconds 1

# Test 2: Cache HIT (second call)
Write-Host "Test 2: Cache HIT (second request)" -ForegroundColor Yellow
$time2 = Measure-Command {
    $response2 = Invoke-RestMethod -Uri $url -Headers $headers -Method GET
}
Write-Host "Time: $($time2.TotalMilliseconds) ms" -ForegroundColor Green
Write-Host "Records: $($response2.Count)" -ForegroundColor Green
Write-Host ""

# Calculate improvement
$improvement = [math]::Round((($time1.TotalMilliseconds - $time2.TotalMilliseconds) / $time1.TotalMilliseconds) * 100, 2)
Write-Host "=== Results ===" -ForegroundColor Cyan
Write-Host "Cache MISS: $($time1.TotalMilliseconds) ms"
Write-Host "Cache HIT:  $($time2.TotalMilliseconds) ms"
Write-Host "Improvement: $improvement% faster" -ForegroundColor Green
```

**Run:**
```bash
.\test-performance.ps1
```

**Expected Output:**
```
=== Performance Test ===

Test 1: Cache MISS (first request)
Time: 89.5 ms
Records: 15

Test 2: Cache HIT (second request)
Time: 8.2 ms
Records: 15

=== Results ===
Cache MISS: 89.5 ms
Cache HIT:  8.2 ms
Improvement: 90.84% faster
```

---

### **B. Load Testing (Optional)**

Dùng **Apache Bench (ab)** hoặc **k6**:

```bash
# Install k6
choco install k6

# Create load-test.js
```

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 20 },   // Stay at 20 users
    { duration: '10s', target: 0 },   // Ramp down
  ],
};

const BASE_URL = 'http://localhost:3000';
const TOKEN = 'YOUR_ACCESS_TOKEN';

export default function () {
  let headers = {
    'Authorization': `Bearer ${TOKEN}`,
  };

  // Test cached endpoint
  let res = http.get(`${BASE_URL}/events`, { headers });
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 50ms': (r) => r.timings.duration < 50,
  });

  sleep(1);
}
```

**Run:**
```bash
k6 run load-test.js
```

---

## **8. Verification Checklist**

### **✅ JWT Authentication**

- [ ] Register tạo user mới trong database
- [ ] Password được hash (bcrypt)
- [ ] Login với đúng credentials trả về tokens
- [ ] Login với sai credentials trả về 401
- [ ] Protected routes yêu cầu Bearer token
- [ ] Token hết hạn trả về 401 Unauthorized
- [ ] Refresh token renew access token thành công
- [ ] Logout xóa refresh token khỏi database
- [ ] Không thể reuse refresh token sau logout

---

### **✅ RBAC (Role-Based Access Control)**

- [ ] Admin access tất cả routes
- [ ] Staff access user routes + một số admin routes
- [ ] User chỉ access public routes + own profile
- [ ] Role hierarchy hoạt động (Admin > Staff > User)
- [ ] 403 Forbidden khi không đủ quyền
- [ ] @RequireRole() decorator hoạt động
- [ ] RolesGuard check permissions chính xác
- [ ] Assign role chỉ Admin có thể thực hiện

---

### **✅ Server-Side Caching**

- [ ] Cache MISS log xuất hiện lần đầu
- [ ] Cache HIT log xuất hiện lần sau
- [ ] Response time giảm đáng kể với cache (>80%)
- [ ] Cache invalidation khi create/update/delete
- [ ] Cache TTL hoạt động đúng (expire sau TTL)
- [ ] Cache management endpoints hoạt động
- [ ] Chỉ Admin access cache management
- [ ] Clear cache hoạt động (specific + all)

---

### **✅ HTTP Caching (ETag & Cache-Control)**

- [ ] ETag header trong response
- [ ] 304 Not Modified với If-None-Match header
- [ ] Cache-Control headers đúng với từng endpoint
- [ ] @NoCache() decorator hoạt động (/users/me)
- [ ] Browser cache hoạt động (DevTools Network tab)
- [ ] ETag thay đổi khi data thay đổi
- [ ] Cache-Control max-age được respect
- [ ] Private endpoints không cache (no-store)

---

## **9. Logs để Monitor**

### **A. Authentication Logs**

```
[AuthService] User registered: testuser@example.com
[AuthService] Password hashed for user: testuser@example.com
[AuthService] User logged in: testuser@example.com
[AuthService] Access token generated for user ID: 1
[AuthService] Refresh token stored in database
[AuthService] Token refreshed for user: 1
[AuthService] User logged out: testuser@example.com
```

---

### **B. RBAC Logs**

```
[RolesGuard] Checking permissions for route: GET /users
[RolesGuard] Required role: STAFF
[RolesGuard] User role: ADMIN
[RolesGuard] User 1 with role ADMIN accessing route
[RolesGuard] Access granted

[RolesGuard] User 5 with role USER accessing route
[RolesGuard] Required role: ADMIN, User has: USER
[RolesGuard] Access denied - insufficient permissions
```

---

### **C. Cache Logs**

```
[CacheService] Cache miss for key: events:all
[CacheService] Fetching data from database...
[CacheService] Setting cache for key: events:all, TTL: 120
[CacheService] Cache set successfully

[CacheService] Cache hit for key: events:all
[CacheService] Returning cached data

[CacheService] Invalidating cache for pattern: events:*
[CacheService] Cache cleared for pattern: events:*
[CacheService] 3 keys deleted
```

---

### **D. HTTP Cache Logs**

```
[HttpCacheInterceptor] Processing GET /events
[HttpCacheInterceptor] Generating ETag for response
[HttpCacheInterceptor] ETag generated: "1a2b3c4d5e6f"
[HttpCacheInterceptor] Setting Cache-Control: public, max-age=300

[HttpCacheInterceptor] Client ETag: "1a2b3c4d5e6f"
[HttpCacheInterceptor] Server ETag: "1a2b3c4d5e6f"
[HttpCacheInterceptor] ETag match - returning 304 Not Modified

[HttpCacheInterceptor] @NoCache() applied - disabling cache
[HttpCacheInterceptor] Setting Cache-Control: no-cache, no-store
```

---

## **10. Troubleshooting**

### **A. Common Issues**

#### **401 Unauthorized**
```
Error: Unauthorized
```

**Solutions:**
- Check token có trong Authorization header không
- Token đã hết hạn chưa (access token: 15 phút)
- Token format đúng: `Bearer {token}`
- Refresh token nếu access token hết hạn

---

#### **403 Forbidden**
```
Error: Forbidden resource
```

**Solutions:**
- Check user role có đủ quyền không
- Verify role hierarchy
- Check @RequireRole() decorator trên route
- Ensure user đã login và có token valid

---

#### **Cache Not Working**
```
Cache always MISS
```

**Solutions:**
- Check CacheModule đã import trong module chưa
- Verify CacheService được inject đúng
- Check logs có "Cache hit/miss" không
- Restart server để clear old cache

---

#### **ETag Always Returns 200**
```
Always 200 OK, never 304
```

**Solutions:**
- Check If-None-Match header có trong request không
- ETag format đúng với quotes: `"abc123"`
- HttpCacheInterceptor đã được apply chưa
- Check response body có thay đổi không

---

### **B. Debug Commands**

```bash
# Check server logs
npm run start:dev

# Check database
npx prisma studio

# Check cache (Redis nếu dùng)
redis-cli
> KEYS *
> GET events:all

# Test endpoint với curl
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/events

# Check response headers
curl -I -H "Authorization: Bearer TOKEN" http://localhost:3000/events
```

---

## **11. Next Steps**

### **Performance Optimization:**
- [ ] Add Redis for distributed caching
- [ ] Implement rate limiting
- [ ] Add request/response compression
- [ ] Setup CDN for static assets

### **Security Enhancements:**
- [ ] Add CORS configuration
- [ ] Implement helmet for security headers
- [ ] Add request validation (class-validator)
- [ ] Setup HTTPS/SSL

### **Monitoring:**
- [ ] Add logging service (Winston)
- [ ] Setup error tracking (Sentry)
- [ ] Add performance monitoring (New Relic)
- [ ] Create health check endpoint

---

## **📚 Documentation**

- [Authentication Setup](./AUTHENTICATION_SETUP.md)
- [RBAC Guide](./src/api/auth/RBAC_GUIDE.md)
- [Postman Testing](./POSTMAN_TESTING.md)
- [API Documentation](./DOCUMENTATION_INDEX.md)