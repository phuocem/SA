# Testing with Postman

## 1. Import the Collection

1. Open Postman
2. Click **Import** (top left)
3. Select **Upload Files**
4. Choose `Campus-Hub-Auth.postman_collection.json`

Or use this link if you have Postman installed:
```
Click: File → Import → Upload Files → Select the collection file
```

## 2. Set Up Environment

### Option A: Automatic Setup (Recommended)
The collection automatically saves tokens to environment variables when you register or login.

### Option B: Manual Setup
1. Create a new environment or use the collection default
2. Set these variables:
   - `base_url`: `http://localhost:3000`
   - `access_token`: (will be filled after login)
   - `refresh_token`: (will be filled after login)
   - `user_id`: (will be filled after login)

## 3. Test the Endpoints

### Step 1: Register a New User
1. Click **Register** request
2. Modify the body with your test data:
   ```json
   {
     "email": "john.doe@example.com",
     "password": "SecurePass123",
     "name": "John Doe"
   }
   ```
3. Click **Send**
4. ✅ You'll receive access_token, refresh_token, and user info
5. Tokens are automatically saved to environment

### Step 2: Login
1. Click **Login** request
2. Use the same email/password from registration
3. Click **Send**
4. ✅ New tokens are automatically saved

### Step 3: Refresh Token (Optional)
1. Click **Refresh Token** request
2. The refresh_token is automatically populated from environment
3. Click **Send**
4. ✅ You get a new access_token

### Step 4: Logout
1. Click **Logout** request
2. The tokens are automatically populated from environment
3. Click **Send**
4. ✅ Refresh token is revoked

### Step 5: Test Protected Routes
1. Click **Example - Get Events (Protected)**
2. The access_token is automatically included in Authorization header
3. Click **Send**
4. ✅ You'll get the protected data if authenticated

## 4. Debugging Tips

### Check Tokens
View your environment variables:
1. Click the environment icon (top right)
2. You'll see all saved tokens and user_id

### Token Expiration
- Access token expires in 15 minutes
- Use **Refresh Token** endpoint to get a new one
- Refresh token expires in 7 days

### Common Issues

**401 Unauthorized**
- ❌ Token expired → Use Refresh Token endpoint
- ❌ Invalid token → Login again
- ❌ Missing Authorization header → Check the header is set correctly

**400 Bad Request**
- ❌ Email already exists → Use different email
- ❌ Invalid email/password → Check your credentials
- ❌ Missing required fields → Verify all fields are filled

**Invalid JSON Response**
- Make sure your backend is running: `npm run start:dev`
- Check `http://localhost:3000` is accessible

## 5. Test Different Scenarios

### Test Case 1: Complete Auth Flow
```
Register → Login → Get Protected Route → Refresh Token → Logout
```

### Test Case 2: Multiple Users
```
Register User 1 → Register User 2 → Login as User 1 → Get Protected Route
```

### Test Case 3: Token Expiration
```
Login → Wait 15 minutes → Try Protected Route (401) → Refresh Token → Try Protected Route (success)
```

### Test Case 4: Invalid Credentials
```
Login with wrong password → Get 401
Register with duplicate email → Get 400
```

## 6. Manual Testing (No Collection)

If you prefer manual requests:

### Register
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Protected Route (with token)
```bash
curl -X GET http://localhost:3000/events \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Refresh Token
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

## 7. Expected Responses

### Successful Login (200 OK)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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

### Invalid Credentials (401 Unauthorized)
```json
{
  "message": "Invalid email or password",
  "error": "Unauthorized",
  "statusCode": 401
}
```

### Email Already Registered (400 Bad Request)
```json
{
  "message": "Email already registered",
  "error": "Bad Request",
  "statusCode": 400
}
```

## 8. Tips & Tricks

✅ **Workspace** - Create a Postman workspace to organize collections
✅ **Monitor** - Use Postman Monitor to run collections on schedule
✅ **Tests** - The collection has auto-tests that validate responses and save tokens
✅ **Pre-request Scripts** - Can add custom logic before requests
✅ **Variables** - Use `{{variable_name}}` to reference environment variables

