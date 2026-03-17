# Test Cases for WI #70: Auth User

## Test Case Suite: JWT Authentication Implementation

This document contains functional test cases for the authentication API implementation as specified in WI #70.

---

## TC-001: Verify successful login with valid credentials

### Description
Validates that a user can successfully authenticate with correct email and password, receiving a valid JWT token.

### Preconditions
- User account exists in database with email "test@example.com" and password "SecurePass123"
- Authentication API is running and accessible
- System clock is synchronized

### Test Steps

1. **Send login request with valid credentials**
   - Action: POST request to `/api/auth/login` with JSON body: `{"email": "test@example.com", "password": "SecurePass123"}`
   - Expected Result: HTTP response status 200 OK received

2. **Verify JWT token in response**
   - Action: Parse response body and check for "token" field
   - Expected Result: Token field contains a JWT with format "header.payload.signature" (three dot-separated parts)

3. **Validate token expiration time**
   - Action: Decode JWT payload and verify "exp" (expiration) claim
   - Expected Result: Expiration timestamp is approximately 24 hours from current time (±1 minute tolerance)

4. **Verify user data in response**
   - Action: Parse response body and check for "user" object
   - Expected Result: User object contains id (non-empty), email ("test@example.com"), and name fields

5. **Test token usage on protected endpoint**
   - Action: Make GET request to `/api/users/profile` with Authorization header: `Bearer {token}`
   - Expected Result: Request succeeds with 200 status and returns user profile data

### Test Data
- Email: "test@example.com"
- Password: "SecurePass123"
- Expected token expiration: 24 hours from login time
- Protected endpoint: `/api/users/profile`

### Pass Criteria
- ✅ HTTP status 200 received
- ✅ Valid JWT token returned in response
- ✅ Token contains correct 24-hour expiration
- ✅ Token can be used to access protected endpoints
- ✅ User data in response matches request email

---

## TC-002: Verify login rejection with invalid credentials

### Description
Validates that login fails appropriately when incorrect password is provided, with proper rate limiting and error messages.

### Preconditions
- User account exists with email "test@example.com" and correct password "SecurePass123"
- Rate limiter is configured for 5 attempts per minute
- No prior login attempts in this rate limit window

### Test Steps

1. **Send login request with wrong password**
   - Action: POST `/api/auth/login` with `{"email": "test@example.com", "password": "WrongPassword456"}`
   - Expected Result: HTTP 401 Unauthorized response

2. **Verify error message**
   - Action: Parse response body for error message field
   - Expected Result: Error message contains "Invalid credentials" (generic; doesn't reveal which field was wrong)

3. **Confirm no token issued**
   - Action: Check response body for "token" field
   - Expected Result: Token field is absent, null, or empty string

4. **Verify rate limit counter**
   - Action: Check HTTP response headers for "X-RateLimit-Remaining" header
   - Expected Result: Header shows 4 remaining attempts (1 used out of 5 allowed per minute)

5. **Confirm token cannot be used**
   - Action: Attempt to use any value from response as Bearer token on protected endpoint
   - Expected Result: Request fails with 401 or 403 status

### Test Data
- Email: "test@example.com"
- Invalid Password: "WrongPassword456"
- Expected HTTP Status: 401
- Expected remaining rate limit attempts: 4

### Pass Criteria
- ✅ HTTP status 401 received
- ✅ No JWT token in response
- ✅ Error message does not reveal user existence/password requirements
- ✅ Rate limit counter incremented (X-RateLimit-Remaining: 4)
- ✅ Failed login attempt is logged

---

## TC-003: Verify email format validation

### Description
Validates that the login endpoint rejects requests with invalid email formats before attempting authentication.

### Preconditions
- Login endpoint validation is enabled
- System is ready to accept requests

### Test Steps

1. **Test invalid email format (missing domain)**
   - Action: POST `/api/auth/login` with `{"email": "invalid-email", "password": "AnyPassword123"}`
   - Expected Result: HTTP 400 Bad Request

2. **Verify format validation error message**
   - Action: Parse response for error message
   - Expected Result: Error message indicates "Invalid email format" or similar

3. **Test incomplete email (missing local part)**
   - Action: POST `/api/auth/login` with `{"email": "user@", "password": "AnyPassword123"}`
   - Expected Result: HTTP 400 Bad Request

4. **Test incomplete email (missing host part)**
   - Action: POST `/api/auth/login` with `{"email": "@example.com", "password": "AnyPassword123"}`
   - Expected Result: HTTP 400 Bad Request

5. **Verify rate limit NOT incremented**
   - Action: Check X-RateLimit-Remaining header and compare with baseline
   - Expected Result: Rate limit attempts remaining unchanged (format validation happens before rate limit check)

### Test Data
Invalid emails:
- "invalid-email"
- "user@"
- "@example.com"
- "user @example.com" (space in email)

### Pass Criteria
- ✅ All invalid formats rejected with 400 status
- ✅ Error message clearly indicates format issue
- ✅ Rate limit counter NOT incremented for validation failures
- ✅ Database not queried for format validation failures

---

## TC-004: Verify JWT token expiration handling

### Description
Validates that expired JWT tokens and malformed tokens are properly rejected when accessing protected endpoints.

### Preconditions
- Protected endpoint `/api/users/profile` requires valid JWT
- Can generate/manipulate JWT tokens for testing
- System has access to test tokens with various states

### Test Steps

1. **Create expired token**
   - Action: Create JWT token with expiration timestamp set to 1 second in the past
   - Expected Result: Token is valid JWT format but past expiration date

2. **Test expired token on protected endpoint**
   - Action: GET `/api/users/profile` with Authorization: `Bearer {expired_token}`
   - Expected Result: HTTP 403 Forbidden response

3. **Verify expiration error message**
   - Action: Parse response for error message
   - Expected Result: Message indicates "Token expired" or "Token is no longer valid"

4. **Test malformed token**
   - Action: GET `/api/users/profile` with Authorization: `Bearer invalid.token.format`
   - Expected Result: HTTP 403 Forbidden response

5. **Test missing authorization header**
   - Action: GET `/api/users/profile` without Authorization header
   - Expected Result: HTTP 401 Unauthorized response

### Test Data
- Expired token: Valid JWT with exp claim set to past timestamp
- Malformed token: "invalid.token.format"
- Missing header test: No Authorization header in request

### Pass Criteria
- ✅ Expired tokens return 403 Forbidden
- ✅ Malformed tokens return 403 Forbidden
- ✅ Missing Authorization header returns 401 Unauthorized
- ✅ Error messages don't leak internal system details
- ✅ No sensitive information exposed in error responses

---

## TC-005: Verify user creation via /api/users endpoint

### Description
Validates that new users can be successfully created with proper validation, no password in response, and duplicate prevention.

### Preconditions
- `/api/users` POST endpoint is available
- No user exists with email "newuser@example.com"
- Bcrypt hashing is configured

### Test Steps

1. **Create new user with valid data**
   - Action: POST `/api/users` with body: `{"email": "newuser@example.com", "password": "NewPass123!", "name": "John Doe"}`
   - Expected Result: HTTP 201 Created response

2. **Verify user object in response**
   - Action: Parse response for user object
   - Expected Result: Response contains id (UUID or similar), email ("newuser@example.com"), name ("John Doe")

3. **Verify password NOT in response**
   - Action: Check response body for "password" field
   - Expected Result: Password field is absent or not included in returned user object

4. **Test duplicate email prevention**
   - Action: POST `/api/users` with same email "newuser@example.com" and different password
   - Expected Result: HTTP 409 Conflict response

5. **Verify duplicate error message**
   - Action: Parse error response for message
   - Expected Result: Message indicates "User with this email already exists" or similar

### Test Data
- Email: "newuser@example.com"
- Password: "NewPass123!"
- Full Name: "John Doe"
- Expected HTTP Status: 201 (for new user), 409 (for duplicate)

### Pass Criteria
- ✅ New user created with 201 status
- ✅ User ID generated and returned
- ✅ Password NOT returned in response
- ✅ Duplicate email rejected with 409 status
- ✅ Password properly hashed in database (verified separately)
- ✅ User record persisted in database

---

## Test Execution Summary

### Recommended Test Order
1. TC-003 (Email validation - no dependencies)
2. TC-001 (Happy path)
3. TC-002 (Error handling)
4. TC-005 (User creation)
5. TC-004 (Token management)

### Success Criteria
- All 5 test cases pass
- No security vulnerabilities identified
- Error messages are consistent and safe
- Rate limiting functions correctly
- Database state is consistent after all tests

### Artifacts Generated
- Test cases written: 5
- Coverage areas: Happy path, negative testing, validation, security, integration
- Regression areas identified: 10
- Risk level assessed: MEDIUM
