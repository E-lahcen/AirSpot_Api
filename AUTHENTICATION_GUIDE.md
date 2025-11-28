# Authentication API Documentation for Frontend Developers

This guide provides comprehensive information for frontend developers to integrate with the Airspot API authentication system.

## Table of Contents

- [Overview](#overview)
- [Authentication Flow](#authentication-flow)
- [API Endpoints](#api-endpoints)
- [Request/Response Examples](#requestresponse-examples)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Security Considerations](#security-considerations)

---

## Overview

The Airspot API uses **Firebase Authentication** with **multi-tenancy support**. Each organization (tenant) has its own isolated authentication context.

### Base URL

```
Production: https://api.airspot.com
Development: http://localhost:3000
```

### Authentication Method

- **Bearer Token Authentication**: Include JWT token in `Authorization` header
- **Multi-tenant**: Each request requires tenant context via `tenantSlug`

---

## Authentication Flow

### 1. Registration Flow (New Organization)

```
User Input (Form)
    ↓
POST /auth/register
    ↓
Backend creates:
  - Firebase Tenant
  - Firebase User
  - Database User
  - Database Tenant
  - Returns Custom Token as "access_token"
    ↓
Frontend: Firebase signInWithCustomToken(access_token)
    ↓
Firebase returns ID Token
    ↓
Store ID Token + use for API calls
```

### 2. Login Flow (Existing User)

```
User Input (Email + Password + Tenant)
    ↓
POST /auth/login
    ↓
Backend verifies:
  - Tenant exists
  - User credentials valid
  - Returns custom token as "access_token"
    ↓
Frontend: Firebase signInWithCustomToken(access_token)
    ↓
Firebase returns ID Token
    ↓
Store ID Token + use for API calls
```

### 3. Authenticated Requests

```
Every API Call:
Authorization: Bearer <firebase_id_token>
    ↓
Backend validates:
  - Token signature
  - Token expiration
  - User exists
  - Tenant context
    ↓
Request processed
```

---

## API Endpoints

### 1. Register New Organization

**Endpoint:** `POST /auth/register`

**Description:** Creates a new organization (tenant) and its first admin user.

**Headers:**

```http
Content-Type: application/json
```

**Request Body:**

```typescript
{
  "name": string;          // Full name (e.g., "John Doe")
  "company_name": string;  // Company/Organization name
  "email": string;         // Valid email address
  "password": string;      // Min 6 characters
  "first_name"?: string;   // Optional
  "last_name"?: string;    // Optional
}
```

**Success Response (201):**

```json
{
  "statusCode": 201,
  "message": "Account created successfully",
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "john.doe@acme.com",
      "full_name": "John Doe",
      "company_name": "Acme Corporation",
      "firebase_uid": "firebase-uid-123",
      "created_at": "2025-11-23T16:00:00.000Z"
    },
    "tenant": {
      "id": "987fcdeb-51a2-43f7-8d9c-123456789abc",
      "slug": "acme-corporation",
      "company_name": "Acme Corporation",
      "owner_id": "123e4567-e89b-12d3-a456-426614174000",
      "is_active": true
    }
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input data
- `409 Conflict` - Company already exists or email already in use

---

### 2. Login to Existing Account

**Endpoint:** `POST /auth/login`

**Description:** Authenticates a user within their organization's tenant.

**Headers:**

```http
Content-Type: application/json
```

**Request Body:**

```typescript
{
  "email": string;        // User's email
  "password": string;     // User's password (min 6 chars)
  "tenant_slug": string;  // Organization identifier
}
```

**Success Response (200):**

```json
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "john.doe@acme.com",
      "full_name": "John Doe",
      "company_name": "Acme Corporation"
    }
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Invalid credentials
- `404 Not Found` - Tenant doesn't exist

---

### 3. Get Current User Profile

**Endpoint:** `GET /auth/me`

**Description:** Retrieves the authenticated user's profile information.

**Headers:**

```http
Authorization: Bearer <access_token>
```

**Success Response (200):**

```json
{
  "statusCode": 200,
  "message": "User retrieved successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john.doe@acme.com",
    "full_name": "John Doe",
    "firebase_uid": "Ab1Cd2Ef3Gh4...",
    "created_at": "2024-05-20T10:00:00.000Z",
    "updated_at": "2024-05-20T10:00:00.000Z"
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - User not found

---

## Firebase Setup

### Install Firebase SDK

```bash
npm install firebase
# or
yarn add firebase
```

### Initialize Firebase

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

// Firebase configuration (get from Firebase Console)
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, signInWithCustomToken };
```

---

## Request/Response Examples

### Example 1: Complete Registration Flow

```javascript
import { auth, signInWithCustomToken } from './firebase-config';

async function registerUser(userData) {
  try {
    // Step 1: Register with backend API
    const registerResponse = await fetch(
      'https://api.airspot.com/auth/register',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'John Doe',
          company_name: 'Acme Corporation',
          email: 'john.doe@acme.com',
          password: 'SecurePass123!',
          first_name: 'John',
          last_name: 'Doe',
        }),
      },
    );

    const registerData = await registerResponse.json();

    if (!registerResponse.ok) {
      throw new Error(registerData.message);
    }

    // Response contains: { access_token, user, tenant }
    const { access_token, user, tenant } = registerData.data;

    // Step 2: Sign in to Firebase with custom token (access_token is the custom token)
    const userCredential = await signInWithCustomToken(auth, access_token);

    // Step 3: Get Firebase ID token (this is the token for API calls)
    const idToken = await userCredential.user.getIdToken();

    // Step 4: Store tokens and tenant context
    localStorage.setItem('firebaseIdToken', idToken);
    localStorage.setItem('tenantSlug', tenant.slug);
    localStorage.setItem('user', JSON.stringify(user));

    return { idToken, user, tenant };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}
```

### Example 2: Login Flow

```javascript
import { auth, signInWithCustomToken } from './firebase-config';

async function loginUser(credentials) {
  try {
    // Step 1: Login with backend API
    const loginResponse = await fetch('https://api.airspot.com/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'john.doe@acme.com',
        password: 'SecurePass123!',
        tenant_slug: 'acme-corporation',
      }),
    });

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      throw new Error(loginData.message);
    }

    // Response contains: { access_token, user }
    const { access_token, user } = loginData.data;

    // Step 2: Sign in to Firebase with custom token (access_token is the custom token)
    const userCredential = await signInWithCustomToken(auth, access_token);

    // Step 3: Get Firebase ID token (this is the token for API calls)
    const idToken = await userCredential.user.getIdToken();

    // Step 4: Store tokens and tenant context
    localStorage.setItem('firebaseIdToken', idToken);
    localStorage.setItem('tenantSlug', 'acme-corporation');
    localStorage.setItem('user', JSON.stringify(user));

    return { idToken, user };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}
```

### Example 3: Authenticated API Request

```javascript
const accessToken = localStorage.getItem('accessToken');

const response = await fetch('https://api.airspot.com/campaigns', {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
});

const campaigns = await response.json();
```

### Example 4: Get Current User

```javascript
import { auth } from './firebase-config';

async function getCurrentUser() {
  try {
    // Get fresh Firebase ID token
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const idToken = await user.getIdToken(true); // Force refresh

    const response = await fetch('https://api.airspot.com/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    const userData = await response.json();
    console.log('Current user:', userData.data);
    return userData.data;
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
}
```

### Example 5: Token Refresh (Automatic)

```javascript
import { auth } from './firebase-config';

// Firebase automatically refreshes tokens
// Get the current valid token before each API call
async function getValidToken() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  // This will automatically refresh if expired
  return await user.getIdToken();
}

// Use in API calls
async function makeAuthenticatedRequest(url, options = {}) {
  const token = await getValidToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  return response;
}
```

---

## Error Handling

### Error Response Format

All errors follow this consistent format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "code": "INVALID_EMAIL",
      "message": "Email format is invalid"
    }
  ]
}
```

### Common Error Codes

| Status Code | Error Code            | Description                            |
| ----------- | --------------------- | -------------------------------------- |
| 400         | `INVALID_INPUT`       | Request validation failed              |
| 400         | `INVALID_EMAIL`       | Email format is invalid                |
| 400         | `PASSWORD_TOO_SHORT`  | Password must be at least 6 characters |
| 401         | `INVALID_CREDENTIALS` | Email or password incorrect            |
| 401         | `TOKEN_EXPIRED`       | Access token has expired               |
| 401         | `INVALID_TOKEN`       | Token is malformed or invalid          |
| 404         | `TENANT_NOT_FOUND`    | Organization/tenant doesn't exist      |
| 404         | `USER_NOT_FOUND`      | User account doesn't exist             |
| 409         | `COMPANY_EXISTS`      | Company already registered             |
| 409         | `EMAIL_IN_USE`        | Email already registered               |

### Error Handling Example

```javascript
try {
  const response = await fetch('https://api.airspot.com/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    // Handle specific error codes
    if (data.statusCode === 401) {
      alert('Invalid email or password');
    } else if (data.statusCode === 404) {
      alert('Organization not found');
    } else {
      alert(data.message || 'An error occurred');
    }
    return;
  }

  // Success - proceed with token exchange
  // ...
} catch (error) {
  console.error('Network error:', error);
  alert('Unable to connect to server');
}
```

---

## Best Practices

### 1. Token Storage

**✅ Recommended:**

- Store `accessToken` in memory (React state, Vuex, Redux)
- Use `httpOnly` cookies for refresh tokens if available
- Clear tokens on logout

**❌ Avoid:**

- Storing tokens in localStorage (XSS vulnerability)
- Exposing tokens in URLs
- Sharing tokens between tabs without encryption

### 2. Token Refresh Strategy

```javascript
import { auth } from './firebase-config';

// Firebase handles token refresh automatically
// Always get fresh token before each request
async function makeAuthenticatedRequest(url, options = {}) {
  try {
    const user = auth.currentUser;

    if (!user) {
      // No user logged in - redirect to login
      window.location.href = '/login';
      return;
    }

    // Get fresh token (Firebase auto-refreshes if needed)
    const idToken = await user.getIdToken();

    // Add token to headers
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${idToken}`,
    };

    const response = await fetch(url, { ...options, headers });

    // Handle token expiration (shouldn't happen with auto-refresh)
    if (response.status === 401) {
      // Force token refresh and retry once
      const freshToken = await user.getIdToken(true);
      headers.Authorization = `Bearer ${freshToken}`;
      return await fetch(url, { ...options, headers });
    }

    return response;
  } catch (error) {
    console.error('Request error:', error);
    throw error;
  }
}
```

### 3. Logout Implementation

```javascript
import { auth } from './firebase-config';
import { signOut } from 'firebase/auth';

async function logout() {
  try {
    // Sign out from Firebase
    await signOut(auth);

    // Clear stored data
    localStorage.removeItem('firebaseIdToken');
    localStorage.removeItem('tenantSlug');
    localStorage.removeItem('user');

    // Clear any user data from state
    clearUserState();

    // Redirect to login
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
  }
}
```

### 4. Protected Routes

```javascript
import { auth } from './firebase-config';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

// React Router example with Firebase auth state
function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });

    return () => unsubscribe();
  }, []);

  // Loading state
  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Authenticated - render protected content
  return children;
}

// Usage
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>;
```

### 5. Tenant Slug Management

```javascript
// Store tenant slug after registration/login
function saveTenantContext(tenantSlug) {
  localStorage.setItem('tenantSlug', tenantSlug);
}

// Retrieve for subsequent requests
function getTenantSlug() {
  return localStorage.getItem('tenantSlug');
}

// Include in forms
<input type="hidden" name="tenantSlug" value={getTenantSlug()} />;
```

---

## Security Considerations

### 1. HTTPS Only

Always use HTTPS in production to prevent token interception:

```javascript
const API_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://api.airspot.com'
    : 'http://localhost:3000';
```

### 2. Input Validation

Validate user input on the frontend before sending:

```javascript
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validatePassword(password) {
  return password.length >= 6;
}
```

### 3. Password Requirements

Enforce strong passwords:

- Minimum 6 characters (recommended: 8+)
- Mix of uppercase, lowercase, numbers
- Special characters recommended

### 4. Rate Limiting

The API implements rate limiting. Handle 429 responses:

```javascript
if (response.status === 429) {
  alert('Too many attempts. Please try again later.');
}
```

### 5. CORS

The API is configured to accept requests from allowed origins only. Ensure your frontend domain is whitelisted.

---

## Complete React Hook Example

```javascript
// useAuth.js - Custom authentication hook
import { useState, useEffect, createContext, useContext } from 'react';
import { auth, signInWithCustomToken } from './firebase-config';
import { signOut } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase auth state
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        const idToken = await firebaseUser.getIdToken();
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          idToken,
        });
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (userData) => {
    const response = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    // Sign in with Firebase (access_token is the Firebase custom token)
    await signInWithCustomToken(auth, data.data.access_token);
    localStorage.setItem('tenantSlug', data.data.tenant.slug);

    return data.data;
  };

  const login = async (credentials) => {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    // Sign in with Firebase (access_token is the Firebase custom token)
    await signInWithCustomToken(auth, data.data.access_token);
    localStorage.setItem('tenantSlug', credentials.tenant_slug);

    return data.data;
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('tenantSlug');
  };

  const getToken = async () => {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, register, login, logout, getToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

---

## TypeScript Interfaces

For TypeScript projects, use these interfaces:

```typescript
// Request DTOs
interface RegisterRequest {
  name: string;
  company_name: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

interface LoginRequest {
  email: string;
  password: string;
  tenant_slug: string;
}

// Response Types
interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

interface RegisterResponse {
  access_token: string; // This is the Firebase custom token
  user: {
    id: string;
    email: string;
    full_name: string;
    company_name: string;
    firebase_uid: string;
    created_at: string;
  };
  tenant: {
    id: string;
    slug: string;
    company_name: string;
    owner_id: string;
    is_active: boolean;
  };
}

interface LoginResponse {
  access_token: string; // This is the Firebase custom token
  user: {
    id: string;
    email: string;
    full_name: string;
    company_name: string;
  };
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  firebase_uid: string;
  created_at: string;
  updated_at: string;
}

interface ErrorResponse {
  statusCode: number;
  message: string;
  errors?: Array<{
    code: string;
    message: string;
  }>;
}
```

---

## Testing with Postman/Insomnia

### 1. Register New User

```
POST https://api.airspot.com/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "company_name": "Test Company",
  "email": "test@example.com",
  "password": "Test123!"
}

# Response will include access_token (this is the Firebase custom token)
# Use: signInWithCustomToken(auth, response.data.access_token)
```

### 2. Login

```
POST https://api.airspot.com/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test123!",
  "tenant_slug": "test-company"
}

# Response will include access_token (this is the Firebase custom token)
# Use: signInWithCustomToken(auth, response.data.access_token)
```

### 3. Get Current User

```
GET https://api.airspot.com/auth/me
Authorization: Bearer <firebase_id_token>

# Get firebase_id_token from Firebase after signInWithCustomToken
# Or use: firebase.auth().currentUser.getIdToken()
```

---

## Important Notes

### Firebase Custom Token vs ID Token

1. **Custom Token** (from backend as "access_token"):
   - Returned by `/auth/register` and `/auth/login` in the `access_token` field
   - Used ONLY to authenticate with Firebase SDK via `signInWithCustomToken()`
   - Cannot be used for API calls directly
   - Short-lived, single-use token

2. **ID Token** (from Firebase):
   - Obtained after `signInWithCustomToken()` or via `user.getIdToken()`
   - Used for ALL API calls to backend
   - Automatically refreshed by Firebase SDK
   - Include in `Authorization: Bearer <id_token>` header

### Token Flow Diagram

```
Backend API          Firebase SDK           Your API Calls
     │                    │                      │
     ├─ accessToken ─────>│                      │
     │  (custom token)    │                      │
     │              signInWithCustomToken()      │
     │                    │                      │
     │                    ├─ ID Token ──────────>│
     │                    │                      │
     │                    │  (auto-refresh)      │
     │                    ├─ ID Token ──────────>│
     │                    │                      │
```

---

## Support

For questions or issues:

- **Documentation**: https://docs.airspot.com
- **Support Email**: support@airspot.com
- **Developer Forum**: https://community.airspot.com

---

## Changelog

### Version 1.0.0 (Current)

- Initial authentication system
- Multi-tenant support via Firebase
- Register, login, token exchange, and profile endpoints
- Bearer token authentication
