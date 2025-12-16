# Updated Registration Flow

## Overview

The registration process has been refactored to separate email verification from account registration. Users must now verify their email address before they can complete registration.

## New Flow

### 1. Send Verification Code
**Endpoint:** `POST /auth/send-verification-code`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent successfully",
  "data": {
    "message": "Verification code sent"
  }
}
```

**Description:**
- Generates a 6-digit verification code
- Code expires in 15 minutes
- Sends code via email
- Can be called multiple times (generates new code each time)

---

### 2. Verify Email (NEW ENDPOINT)
**Endpoint:** `POST /auth/verify-email`

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "message": "Email verified successfully",
    "verified": true
  }
}
```

**Error Responses:**

- **Verification Not Found (400):**
```json
{
  "success": false,
  "message": "Verification code not found",
  "errors": [
    {
      "code": "VERIFICATION_NOT_FOUND",
      "message": "Please request a verification code first"
    }
  ]
}
```

- **Invalid Code (400):**
```json
{
  "success": false,
  "message": "Invalid verification code",
  "errors": [
    {
      "code": "INVALID_CODE",
      "message": "The provided verification code is incorrect"
    }
  ]
}
```

- **Code Expired (400):**
```json
{
  "success": false,
  "message": "Verification code expired",
  "errors": [
    {
      "code": "CODE_EXPIRED",
      "message": "The verification code has expired. Please request a new one"
    }
  ]
}
```

**Description:**
- Validates the verification code
- Marks the email as verified in the database
- Must be called before registration
- If already verified, returns success without error

---

### 3. Register Account (UPDATED)
**Endpoint:** `POST /auth/register`

**Request Body (verification_code field removed):**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "first_name": "John",
  "last_name": "Doe",
  "company_name": "Acme Corporation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "access_token": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      ...
    },
    "tenant": {
      "id": "uuid",
      "slug": "acme-corporation",
      "company_name": "Acme Corporation",
      ...
    }
  }
}
```

**Error Responses:**

- **Email Not Verified (400):**
```json
{
  "success": false,
  "message": "Email not verified",
  "errors": [
    {
      "code": "EMAIL_NOT_VERIFIED",
      "message": "Please verify your email using the verification code before registering"
    }
  ]
}
```

- **Verification Required (400):**
```json
{
  "success": false,
  "message": "Email verification required",
  "errors": [
    {
      "code": "VERIFICATION_REQUIRED",
      "message": "Please verify your email before registering"
    }
  ]
}
```

**Description:**
- Checks that email has been verified via `/auth/verify-email`
- NO longer accepts `verification_code` field
- Creates Firebase tenant, database schema, and user account
- Returns access token for immediate login

---

## Complete Registration Sequence

```
User Flow:
1. POST /auth/send-verification-code  → Receive email with 6-digit code
2. POST /auth/verify-email            → Validate code and mark email as verified
3. POST /auth/register                → Complete registration with form data
```

## Key Changes

### What Changed
1. **New endpoint added:** `POST /auth/verify-email`
2. **RegisterDto updated:** Removed `verification_code` field
3. **Register endpoint logic:** Now checks `is_verified` flag instead of validating code directly
4. **Separation of concerns:** Email verification is now completely independent from registration

### Benefits
- ✅ Cleaner separation of concerns
- ✅ Email can be verified once and registration attempted multiple times if needed
- ✅ Better error handling and user feedback
- ✅ Simplified registration payload
- ✅ More flexible registration flow

### Database Schema
The `email_verifications` table structure remains the same:
```sql
CREATE TABLE email_verifications (
  id UUID PRIMARY KEY,
  email VARCHAR NOT NULL,
  code VARCHAR NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Security Notes
- Verification codes expire after 15 minutes
- Verified emails remain valid until registration is complete
- After successful registration, the verification record is deleted
- Same email cannot create multiple tenants (enforced at registration)

## Frontend Integration Example

```typescript
// Step 1: Send verification code
async function sendVerificationCode(email: string) {
  const response = await fetch('/auth/send-verification-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return response.json();
}

// Step 2: Verify email with code
async function verifyEmail(email: string, code: string) {
  const response = await fetch('/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code })
  });
  return response.json();
}

// Step 3: Register with verified email
async function register(formData: {
  email: string;
  password: string;
  name: string;
  first_name?: string;
  last_name?: string;
  company_name: string;
}) {
  const response = await fetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  return response.json();
}

// Complete flow
async function completeRegistration(userData) {
  // Step 1
  await sendVerificationCode(userData.email);
  
  // User receives email and enters code
  const userCode = await getCodeFromUser();
  
  // Step 2
  const verifyResult = await verifyEmail(userData.email, userCode);
  if (!verifyResult.success) {
    throw new Error('Email verification failed');
  }
  
  // Step 3
  const registerResult = await register(userData);
  return registerResult;
}
```

## Migration Notes

### For Existing Integrations
- Update API clients to remove `verification_code` from registration payload
- Add call to `/auth/verify-email` before registration
- Update error handling to account for new verification flow
- Consider implementing a UI state machine for the multi-step process

### Backward Compatibility
⚠️ **BREAKING CHANGE:** The `verification_code` field has been removed from the register endpoint. All clients must update to use the new two-step verification flow.
