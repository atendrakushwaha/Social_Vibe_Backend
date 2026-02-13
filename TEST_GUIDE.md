# 🧪 Testing Guide

Complete testing documentation for the NestJS Best Structure project.

## 📋 Table of Contents
- [Quick Start](#quick-start)
- [E2E Tests](#e2e-tests)
- [Unit Tests](#unit-tests)
- [Manual API Testing](#manual-api-testing)
- [Test Coverage](#test-coverage)

---

## 🚀 Quick Start

### Run All Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:cov
```

---

## 🔄 E2E Tests

End-to-end tests verify the complete flow of your application.

### File: `test/app.e2e-spec.ts`

**What it tests:**
- ✅ Health check endpoints
- ✅ User registration flow
- ✅ Login authentication
- ✅ Protected routes with JWT
- ✅ Profile CRUD operations
- ✅ Error handling and validation

### Run E2E Tests
```bash
npm run test:e2e
```

### Expected Output:
```
NestJS Application E2E Tests
  Health Module
    ✓ /api/health/ping (GET) - should return pong with server info
    ✓ /api/health (GET) - should return complete health status
  Auth Module
    ✓ /api/auth/register (POST) - should register a new user
    ✓ /api/auth/login (POST) - should login successfully
    ✓ /api/auth/login (POST) - should fail with wrong password
  Users Module (Protected Routes)
    ✓ /api/users/profile (GET) - should return user profile with valid token
    ✓ /api/users/profile (GET) - should fail without token
  Profile Module
    ✓ /api/profile (POST) - should create profile with valid token
    ✓ /api/profile (GET) - should get user profile
    ✓ /api/profile (PATCH) - should update profile
    ✓ /api/profile (DELETE) - should delete profile

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
```

---

## 🔬 Unit Tests

Unit tests verify individual components in isolation.

### AuthService Tests
**File:** `src/modules/auth/auth.service.spec.ts`

Tests:
- ✅ Login with valid credentials
- ✅ Login with invalid email
- ✅ Login with wrong password
- ✅ JWT token generation

```bash
# Run specific test file
npm test -- auth.service.spec.ts
```

### UsersService Tests
**File:** `src/modules/users/users.service.spec.ts`

Tests:
- ✅ Create user with password hashing
- ✅ Prevent duplicate email registration
- ✅ Find user by email

```bash
# Run specific test file
npm test -- users.service.spec.ts
```

---

## 🧪 Manual API Testing

### Using REST Client (VSCode Extension)

1. **Install Extension:**
   - Install "REST Client" by Huachao Mao in VSCode

2. **Open Test File:**
   - Open `test-api.rest`

3. **Run Tests:**
   - Click "Send Request" above each HTTP request
   - Responses appear in split view

### Using Swagger UI

1. **Start Server:**
   ```bash
   npm run start:dev
   ```

2. **Open Swagger:**
   ```
   http://localhost:3000/swagger
   ```

3. **Test Flow:**
   - Register user → `/api/auth/register`
   - Login → `/api/auth/login`
   - Copy `accessToken`
   - Click "Authorize" 🔒
   - Paste token as: `Bearer <your-token>`
   - Test protected routes

### Using cURL

```bash
# Health Check
curl http://localhost:3000/api/health/ping

# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Atendra Kumar",
    "email": "atendra@gmail.com",
    "password": "password123",
    "role": "user"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "atendra@gmail.com",
    "password": "password123"
  }'

# Get Profile (replace TOKEN)
curl http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### Using Postman

1. **Import Collection:**
   - Create requests from `test-api.rest`
   - Or use Swagger export

2. **Environment Variables:**
   ```
   baseUrl: http://localhost:3000/api
   token: <your-jwt-token>
   ```

---

## 📊 Test Coverage

### Generate Coverage Report
```bash
npm run test:cov
```

### View Coverage
```bash
# Coverage report will be in: coverage/lcov-report/index.html
start coverage/lcov-report/index.html
```

### Coverage Goals
- **Statements:** > 80%
- **Branches:** > 75%
- **Functions:** > 80%
- **Lines:** > 80%

---

## 🧪 Test Scenarios

### ✅ Successful Flows

**1. Complete User Journey**
```
Register → Login → Get Profile → Create Profile → Update Profile → Delete Profile
```

**2. Health Monitoring**
```
Ping → Full Health Check
```

### ❌ Error Cases

**1. Validation Errors**
- Invalid email format
- Missing required fields
- Short password

**2. Authentication Errors**
- Wrong password
- Non-existent user
- Missing JWT token
- Invalid JWT token

**3. Authorization Errors**
- Accessing protected route without token
- Using expired token

**4. Business Logic Errors**
- Duplicate email registration
- Creating duplicate profile

---

## 📝 Test Data

### Sample Users
```json
{
  "name": "Atendra Kumar",
  "email": "atendra@gmail.com",
  "password": "password123",
  "role": "user"
}
```

### Sample Profile
```json
{
  "name": "Atendra Kumar",
  "age": 28,
  "address": "123 Main Street, City",
  "phone": "9876543210",
  "avatar": "https://example.com/avatar.jpg"
}
```

---

## 🔍 Debugging Tests

### Run Single Test
```bash
# Run specific test
npm test -- --testNamePattern="should login successfully"

# Run specific file
npm test auth.service.spec.ts
```

### Debug in VSCode
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

---

## ✨ Best Practices

1. **Run tests before committing**
   ```bash
   npm test
   ```

2. **Keep tests isolated** - Each test should be independent

3. **Use meaningful descriptions** - Test names should explain what they verify

4. **Mock external dependencies** - Database, APIs, etc.

5. **Test edge cases** - Not just happy paths

6. **Maintain test data** - Use consistent, realistic test data

---

## 🎯 Quick Test Checklist

Before deploying:
- [ ] All E2E tests pass
- [ ] All unit tests pass
- [ ] Coverage meets minimum thresholds
- [ ] Manual testing in Swagger works
- [ ] Health checks return positive status
- [ ] JWT authentication works
- [ ] Protected routes are secure
- [ ] Error messages are user-friendly

---

## 📞 Support

If tests fail:
1. Check MongoDB is running
2. Verify `.env` configuration
3. Ensure port 3000 is available
4. Check dependencies are installed
5. Review error messages in console

**Happy Testing! 🚀**
