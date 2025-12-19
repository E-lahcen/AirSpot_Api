# Registration and Sign-In Flow

This document provides a comprehensive explanation of how user registration and sign-in work in the AirSpot API, including the technical flow, database operations, and Firebase integration.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Components](#architecture-components)
3. [Registration Flow](#registration-flow)
4. [Sign-In Flow](#sign-in-flow)
5. [Token Exchange Flow](#token-exchange-flow)
6. [Authentication Guards](#authentication-guards)
7. [Multi-Tenancy](#multi-tenancy)
8. [Data Flow Diagrams](#data-flow-diagrams)
9. [API Endpoints](#api-endpoints)
10. [Error Handling](#error-handling)

---

## Overview

The AirSpot API implements a **multi-tenant authentication system** using Firebase Authentication with custom tenant isolation. Each organization (tenant) has:
- Its own Firebase tenant for authentication
- A dedicated PostgreSQL schema for data isolation
- Unique slug-based identification
- Owner-based access control

### Key Technologies

- **Firebase Admin SDK**: Multi-tenant authentication
- **NestJS**: Backend framework
- **PostgreSQL**: Multi-schema database with TypeORM
- **JWT Tokens**: Firebase ID tokens for API authorization

---

## Architecture Components

### 1. Core Modules

| Module | Responsibility |
|--------|---------------|
| **AuthModule** | User registration, login, token management |
| **TenantModule** | Tenant creation, schema management |
| **UserModule** | User CRUD operations within tenant schemas |
| **FirebaseModule** | Firebase tenant and user management |
| **RoleModule** | Role-based access control (RBAC) |
| **UserTenantModule** | User-tenant relationship mapping |

### 2. Database Structure

```
┌─────────────────────────────────────────────┐
│         Public Schema (Shared)              │
├─────────────────────────────────────────────┤
│ - tenants                                   │
│   ├── id (UUID)                             │
│   ├── slug (unique)                         │
│   ├── company_name                          │
│   ├── firebase_tenant_id                    │
│   ├── schema_name                           │
│   ├── owner_id                              │
│   ├── owner_email                           │
│   ├── status (pending/approved/rejected)    │
│   └── is_active                             │
│                                             │
│ - user_tenants (mapping table)              │
│   ├── user_id                               │
│   ├── tenant_id                             │
│   └── email                                 │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│    Tenant Schema (Per Organization)         │
├─────────────────────────────────────────────┤
│ - users                                     │
│   ├── id (UUID)                             │
│   ├── email                                 │
│   ├── first_name                            │
│   ├── last_name                             │
│   ├── full_name                             │
│   ├── company_name                          │
│   ├── firebase_uid                          │
│   └── roles (many-to-many)                  │
│                                             │
│ - roles                                     │
│ - campaigns                                 │
│ - storyboards                               │
│ - ... (all tenant-specific data)            │
└─────────────────────────────────────────────┘
```

---

## Registration Flow

### Endpoint
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "company_name": "Acme Corporation",
  "email": "john.doe@acme.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

### Step-by-Step Process

#### Step 1: Request Validation
```
Client → POST /auth/register → RegisterDto Validation
```

**RegisterDto Fields:**
- `name`: Full name (required)
- `company_name`: Organization name (required)
- `email`: User email (required, valid email format)
- `password`: Password (required, min 6 characters)
- `first_name`: First name (optional)
- `last_name`: Last name (optional)

#### Step 2: Check Existing Tenant
```typescript
// AuthService.register()
const existingTenant = await this.tenantManagementService
  .findByCompanyName(dto.company_name);

if (existingTenant) {
  throw new ConflictException('Company already exists');
}
```

**Purpose**: Prevent duplicate organizations with the same company name.

#### Step 3: Create Firebase Tenant
```typescript
// FirebaseService.createTenant()
const firebaseTenant = await this.auth.tenantManager().createTenant({
  displayName: "acme-corporation", // Formatted slug
  emailSignInConfig: {
    enabled: true,
    passwordRequired: true,
  },
  multiFactorConfig: {
    state: "DISABLED",
  },
});
```

**Firebase Tenant Properties:**
- Display name follows Firebase naming rules (4-20 chars, alphanumeric + hyphens)
- Email/password authentication enabled
- Returns `tenantId` (Firebase tenant identifier)

#### Step 4: Create Database Tenant
```typescript
// TenantManagementService.createTenant()
const tenant = await this.tenantManagementService.createTenant({
  companyName: dto.company_name,
  ownerEmail: dto.email,
  firebaseTenantId: firebaseTenant.tenantId,
});
```

**This creates:**
1. **Tenant Record** in `public.tenants` table
   - Generates unique slug: `"acme-corporation"`
   - Generates schema name: `"tenant_acme_corporation"` (hyphens → underscores)
   - Sets initial status: `"pending"`
   - Stores Firebase tenant ID

2. **PostgreSQL Schema** for tenant data
   ```sql
   CREATE SCHEMA IF NOT EXISTS tenant_acme_corporation;
   ```

3. **Runs Tenant Migrations** to create tables in new schema
   - users
   - roles
   - campaigns
   - storyboards
   - All other tenant-specific tables

#### Step 5: Set Tenant Context & Create Roles
```typescript
// Set tenant context for subsequent operations
this.tenantService.setTenant(tenant);

// Ensure default roles exist in tenant schema
await this.roleService.ensureDefaultRoles();
// Creates: owner, admin, member, viewer roles
```

**Default Roles Created:**
- `owner`: Full access, can manage organization
- `admin`: Administrative access
- `member`: Standard user access
- `viewer`: Read-only access

#### Step 6: Create Firebase User
```typescript
// FirebaseService.createTenantUser()
const firebaseUser = await this.auth
  .tenantManager()
  .authForTenant(tenant.firebase_tenant_id)
  .createUser({
    email: dto.email,
    password: dto.password,
    displayName: dto.name,
  });
```

**Result**: User created in Firebase tenant context with unique `uid`.

#### Step 7: Create Database User
```typescript
// UserService.createUser() - in tenant schema
const user = await this.userService.createUser({
  first_name: dto.first_name,
  last_name: dto.last_name,
  full_name: dto.name,
  company_name: tenant.company_name,
  email: dto.email,
  firebase_uid: firebaseUser.uid,
  roles: [ownerRole], // Assigned owner role
});
```

**User Record Created in**: `tenant_acme_corporation.users`

#### Step 8: Create User-Tenant Mapping
```typescript
// UserTenantService.create() - in public schema
await this.userTenantService.create({
  user_id: user.id,
  tenant_id: tenant.id,
  email: dto.email,
});
```

**Purpose**: Maps user to tenant in public schema for cross-tenant lookups.

#### Step 9: Set Firebase Custom Claims
```typescript
// FirebaseService.setTenantUserClaims()
await this.firebaseService.setTenantUserClaims(
  tenant.firebase_tenant_id,
  firebaseUser.uid,
  {
    firebaseTenantId: tenant.firebase_tenant_id,
    tenantId: tenant.id,
    slug: tenant.slug,
    roles: [ownerRole],
  }
);
```

**Custom Claims Stored in JWT:**
- `firebaseTenantId`: Firebase tenant identifier
- `tenantId`: Database tenant UUID
- `slug`: Tenant slug for routing
- `roles`: User roles array

#### Step 10: Create Custom Token
```typescript
// FirebaseService.createTenantCustomToken()
const accessToken = await this.auth
  .tenantManager()
  .authForTenant(tenant.firebase_tenant_id)
  .createCustomToken(firebaseUser.uid, customClaims);
```

**Custom Token**: Short-lived token for client-side Firebase sign-in.

#### Step 11: Set Tenant Owner
```typescript
// Mark user as tenant owner
await this.tenantManagementService.setTenantOwner(tenant.id, user.id);
```

#### Step 12: Return Response
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
      "created_at": "2025-12-09T10:00:00.000Z"
    },
    "tenant": {
      "id": "tenant-uuid",
      "slug": "acme-corporation",
      "company_name": "Acme Corporation",
      "owner_id": "123e4567-e89b-12d3-a456-426614174000"
    }
  }
}
```

---

## Sign-In Flow

### Endpoint
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john.doe@acme.com",
  "password": "SecurePass123!"
}
```

### Step-by-Step Process

#### Step 1: Find User's Tenant
```typescript
// Look up user-tenant mapping by email
const userTenantResult = await this.userTenantService.findAll({
  email: dto.email,
});

if (!userTenantResult?.items?.length) {
  throw new NotFoundException('Tenant not found for provided email');
}

const tenantSlug = userTenantResult.items[0].tenant.slug;
```

**Purpose**: Determine which tenant the user belongs to (users can only belong to one tenant currently).

#### Step 2: Validate Tenant
```typescript
const tenant = await this.tenantManagementService.findBySlug(tenantSlug);

if (!tenant) {
  throw new NotFoundException('Tenant not found');
}

if (!tenant.is_active) {
  throw new UnauthorizedException('Tenant is inactive');
}
```

**Checks:**
- Tenant exists
- Tenant is active (not suspended)

#### Step 3: Get Tenant-Specific Firebase Auth
```typescript
const tenantAuth = this.auth
  .tenantManager()
  .authForTenant(tenant.firebase_tenant_id);
```

**Purpose**: Get Firebase Auth instance scoped to the specific tenant.

#### Step 4: Verify User Exists in Firebase
```typescript
const firebaseUser = await tenantAuth.getUserByEmail(dto.email);

if (!firebaseUser) {
  throw new UnauthorizedException('Invalid credentials');
}
```

#### Step 5: Set Tenant Context
```typescript
this.tenantService.setTenant(tenant);
```

**Effect**: All subsequent database queries use `tenant_acme_corporation` schema.

#### Step 6: Get User from Database
```typescript
const user = await this.userService.findByEmail(dto.email);

if (!user) {
  throw new NotFoundException('User not found in tenant');
}
```

**Checks**: User exists in tenant's database schema.

#### Step 7: Create Custom Token with Claims
```typescript
const accessToken = await tenantAuth.createCustomToken(
  firebaseUser.uid,
  {
    slug: tenant.slug,
    tenantId: tenant.id,
    roles: user.roles,
    firebaseTenantId: tenant.firebase_tenant_id,
  }
);
```

**Custom Token**: Contains user identity + tenant context.

#### Step 8: Return Response
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

---

## Token Exchange Flow

After receiving the `access_token` (custom token) from registration or login, the client must exchange it for a Firebase ID token.

### Frontend Flow

```javascript
import { auth, signInWithCustomToken } from './firebase-config';

// Step 1: Get custom token from backend
const response = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { access_token } = await response.json();

// Step 2: Exchange custom token for Firebase ID token
const userCredential = await signInWithCustomToken(auth, access_token);

// Step 3: Get Firebase ID token
const idToken = await userCredential.user.getIdToken();

// Step 4: Use ID token for authenticated API requests
const apiResponse = await fetch('/campaigns', {
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'X-Tenant-Slug': 'acme-corporation'
  }
});
```

### Alternative: Backend Token Exchange

```http
POST /auth/exchange-token
Content-Type: application/json

{
  "custom_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tenant_slug": "acme-corporation"
}
```

**Response:**
```json
{
  "id_token": "firebase-id-token",
  "refresh_token": "firebase-refresh-token",
  "expires_in": "3600"
}
```

---

## Authentication Guards

### AuthGuard Flow

Every protected endpoint uses `AuthGuard` to validate requests:

```typescript
@UseGuards(AuthGuard)
@Get('campaigns')
async getCampaigns() { ... }
```

#### Guard Validation Steps

1. **Check if Route is Public**
   ```typescript
   const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [...]);
   if (isPublic) return true;
   ```

2. **Extract Bearer Token**
   ```typescript
   const token = this.extractTokenFromHeader(request);
   // Expects: Authorization: Bearer <firebase-id-token>
   ```

3. **Get Tenant Context**
   ```typescript
   const slug = this.tenantService.getSlug(); // From X-Tenant-Slug header
   const firebaseTenantId = this.tenantService.getFirebaseTenantId();
   ```

4. **Verify Firebase ID Token**
   ```typescript
   const tenantAuth = this.auth
     .tenantManager()
     .authForTenant(firebaseTenantId);
   
   const decodedToken = await tenantAuth.verifyIdToken(token);
   ```

5. **Verify Tenant Match**
   ```typescript
   if (decodedToken.firebase.tenant !== firebaseTenantId) {
     throw new UnauthorizedException('Token does not match tenant');
   }
   ```

6. **Load User from Database**
   ```typescript
   const user = await this.userService.findByFirebaseUid(decodedToken.uid);
   ```

7. **Check Tenant Status**
   ```typescript
   const tenant = this.tenantService.getTenant();
   if (tenant.status !== 'approved' && !user.isSuperAdmin) {
     throw new UnauthorizedException('Tenant verification pending');
   }
   ```

8. **Attach User to Request**
   ```typescript
   request.user = {
     ...user,
     firebaseTenantId,
     tenantId,
     slug,
   };
   ```

### RolesGuard Flow

For role-based access control:

```typescript
@UseGuards(AuthGuard, RolesGuard)
@Roles('owner', 'admin', 'super_admin')
@Delete('campaigns/:id')
async deleteCampaign() { ... }
```

Checks if `request.user.roles` includes any of the required roles.

---

## Multi-Tenancy

### How Tenant Isolation Works

#### 1. Tenant Identification
Every request requires `X-Tenant-Slug` header:
```http
X-Tenant-Slug: acme-corporation
```

#### 2. Tenant Middleware
```typescript
// Sets tenant context before request processing
export class TenantMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const slug = req.headers['x-tenant-slug'];
    const tenant = await this.tenantService.findBySlug(slug);
    this.tenantService.setTenant(tenant);
    next();
  }
}
```

#### 3. Schema Switching
```typescript
// TypeORM dynamically switches schemas
this.tenantService.setTenant(tenant);
// All subsequent queries use: tenant_acme_corporation.users
```

#### 4. Firebase Tenant Isolation
```typescript
// Each organization has its own Firebase tenant
const tenantAuth = this.auth
  .tenantManager()
  .authForTenant(firebaseTenantId);

// Users are isolated by Firebase tenant
// User A in Tenant 1 cannot authenticate in Tenant 2
```

---

## Data Flow Diagrams

### Registration Flow Diagram

```
┌──────────┐
│  Client  │
└─────┬────┘
      │ POST /auth/register
      │ { email, password, company_name }
      ▼
┌─────────────────┐
│  AuthController │
└─────┬───────────┘
      │
      ▼
┌─────────────────────────────────────────────────────┐
│              AuthService.register()                  │
├─────────────────────────────────────────────────────┤
│  1. Check if company exists                         │
│     ├─ TenantManagementService.findByCompanyName()  │
│     └─ If exists → throw ConflictException          │
│                                                      │
│  2. Create Firebase Tenant                          │
│     └─ FirebaseService.createTenant()               │
│        └─ Firebase Admin SDK                        │
│           └─ Returns: firebase_tenant_id            │
│                                                      │
│  3. Create Database Tenant + Schema                 │
│     └─ TenantManagementService.createTenant()       │
│        ├─ Insert into public.tenants                │
│        ├─ CREATE SCHEMA tenant_acme_corporation     │
│        └─ Run tenant migrations                     │
│                                                      │
│  4. Set Tenant Context                              │
│     └─ TenantService.setTenant(tenant)              │
│                                                      │
│  5. Create Default Roles                            │
│     └─ RoleService.ensureDefaultRoles()             │
│        └─ Insert into tenant_acme_corporation.roles │
│                                                      │
│  6. Create Firebase User                            │
│     └─ FirebaseService.createTenantUser()           │
│        └─ Firebase tenantAuth.createUser()          │
│           └─ Returns: firebase_uid                  │
│                                                      │
│  7. Create Database User                            │
│     └─ UserService.createUser()                     │
│        └─ Insert into tenant_acme_corporation.users │
│                                                      │
│  8. Create User-Tenant Mapping                      │
│     └─ UserTenantService.create()                   │
│        └─ Insert into public.user_tenants           │
│                                                      │
│  9. Set Firebase Custom Claims                      │
│     └─ FirebaseService.setTenantUserClaims()        │
│        └─ Firebase tenantAuth.setCustomUserClaims() │
│                                                      │
│ 10. Create Custom Token                             │
│     └─ FirebaseService.createTenantCustomToken()    │
│        └─ Firebase tenantAuth.createCustomToken()   │
│           └─ Returns: access_token                  │
│                                                      │
│ 11. Set Tenant Owner                                │
│     └─ TenantManagementService.setTenantOwner()     │
│                                                      │
│ 12. Return Response                                 │
│     └─ { access_token, user, tenant }               │
└─────────────────────────────────────────────────────┘
      │
      ▼
┌──────────┐
│  Client  │ Receives: { access_token, user, tenant }
└──────────┘
      │
      │ signInWithCustomToken(auth, access_token)
      ▼
┌──────────────┐
│   Firebase   │ Returns: Firebase ID Token
└──────────────┘
      │
      ▼
┌──────────┐
│  Client  │ Stores ID Token for API calls
└──────────┘
```

### Login Flow Diagram

```
┌──────────┐
│  Client  │
└─────┬────┘
      │ POST /auth/login
      │ { email, password }
      ▼
┌─────────────────┐
│  AuthController │
└─────┬───────────┘
      │
      ▼
┌──────────────────────────────────────────────────┐
│            AuthService.login()                    │
├──────────────────────────────────────────────────┤
│  1. Find User's Tenant                           │
│     └─ UserTenantService.findAll({ email })      │
│        └─ Query: public.user_tenants             │
│           └─ Returns: tenant_slug                │
│                                                   │
│  2. Load Tenant                                  │
│     └─ TenantManagementService.findBySlug()      │
│        └─ Query: public.tenants                  │
│           └─ Returns: tenant object              │
│                                                   │
│  3. Check Tenant Status                          │
│     ├─ If !tenant.is_active                      │
│     └─ throw UnauthorizedException               │
│                                                   │
│  4. Get Firebase Tenant Auth                     │
│     └─ auth.tenantManager()                      │
│        .authForTenant(firebase_tenant_id)        │
│                                                   │
│  5. Verify User in Firebase                      │
│     └─ tenantAuth.getUserByEmail(email)          │
│        ├─ If not found → throw UnauthorizedException
│        └─ Returns: firebase_user                 │
│                                                   │
│  6. Set Tenant Context                           │
│     └─ TenantService.setTenant(tenant)           │
│                                                   │
│  7. Get User from Database                       │
│     └─ UserService.findByEmail(email)            │
│        └─ Query: tenant_acme_corporation.users   │
│           └─ Returns: user (with roles)          │
│                                                   │
│  8. Create Custom Token                          │
│     └─ tenantAuth.createCustomToken(uid, {       │
│          slug, tenantId, roles,                  │
│          firebaseTenantId                        │
│        })                                        │
│        └─ Returns: access_token                  │
│                                                   │
│  9. Return Response                              │
│     └─ { access_token, user }                    │
└──────────────────────────────────────────────────┘
      │
      ▼
┌──────────┐
│  Client  │ Receives: { access_token, user }
└──────────┘
      │
      │ signInWithCustomToken(auth, access_token)
      ▼
┌──────────────┐
│   Firebase   │ Returns: Firebase ID Token
└──────────────┘
      │
      ▼
┌──────────┐
│  Client  │ Stores ID Token for API calls
└──────────┘
```

### Authenticated Request Flow

```
┌──────────┐
│  Client  │
└─────┬────┘
      │ GET /campaigns
      │ Headers:
      │   Authorization: Bearer <firebase-id-token>
      │   X-Tenant-Slug: acme-corporation
      ▼
┌──────────────────┐
│ TenantMiddleware │
└─────┬────────────┘
      │ 1. Extract X-Tenant-Slug
      │ 2. Load tenant from DB
      │ 3. Set tenant context
      ▼
┌──────────────┐
│  AuthGuard   │
└─────┬────────┘
      │ 1. Extract Bearer token
      │ 2. Get tenant context
      │ 3. Get Firebase tenantAuth
      │ 4. Verify ID token signature
      │ 5. Check token.firebase.tenant matches
      │ 6. Load user from DB
      │ 7. Check tenant status
      │ 8. Attach user to request
      ▼
┌──────────────────┐
│ CampaignController│
└─────┬────────────┘
      │ request.user available
      │ TenantService has context set
      ▼
┌──────────────────┐
│ CampaignService  │
└─────┬────────────┘
      │ Queries tenant_acme_corporation.campaigns
      ▼
┌──────────────┐
│   Database   │
└─────┬────────┘
      │
      ▼
┌──────────┐
│  Client  │ Receives: { campaigns: [...] }
└──────────┘
```

---

## API Endpoints

### 1. Register
```http
POST /auth/register
```

**Request:**
```json
{
  "name": "John Doe",
  "company_name": "Acme Corporation",
  "email": "john.doe@acme.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response (201):**
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
      "created_at": "2025-12-09T10:00:00.000Z"
    },
    "tenant": {
      "id": "tenant-uuid",
      "slug": "acme-corporation",
      "company_name": "Acme Corporation",
      "owner_id": "123e4567-e89b-12d3-a456-426614174000"
    }
  }
}
```

### 2. Login
```http
POST /auth/login
```

**Request:**
```json
{
  "email": "john.doe@acme.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
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

### 3. Exchange Token
```http
POST /auth/exchange-token
```

**Request:**
```json
{
  "custom_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tenant_slug": "acme-corporation"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Token exchanged successfully",
  "data": {
    "id_token": "firebase-id-token",
    "refresh_token": "firebase-refresh-token",
    "expires_in": "3600"
  }
}
```

### 4. Get Current User
```http
GET /auth/me
Authorization: Bearer <firebase-id-token>
X-Tenant-Slug: acme-corporation
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "User retrieved successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john.doe@acme.com",
    "full_name": "John Doe",
    "company_name": "Acme Corporation",
    "firebase_uid": "firebase-uid-123",
    "roles": [
      {
        "id": "role-uuid",
        "name": "owner",
        "description": "Organization owner"
      }
    ]
  }
}
```

### 5. Refresh Token
```http
POST /auth/refresh-token
```

**Request:**
```json
{
  "refresh_token": "firebase-refresh-token",
  "tenant_slug": "acme-corporation"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Token refreshed successfully",
  "data": {
    "id_token": "new-firebase-id-token",
    "refresh_token": "new-firebase-refresh-token",
    "expires_in": "3600"
  }
}
```

---

## Error Handling

### Common Error Codes

| Error Code | HTTP Status | Description |
|-----------|-------------|-------------|
| `COMPANY_EXISTS` | 409 | Company already registered |
| `USER_EXISTS` | 409 | User already exists in tenant |
| `TENANT_NOT_FOUND` | 404 | Tenant slug not found |
| `TENANT_NOT_FOUND_FOR_EMAIL` | 404 | No tenant for email |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `TENANT_INACTIVE` | 401 | Tenant suspended |
| `USER_NOT_FOUND` | 404 | User not in tenant |
| `FIREBASE_EMAIL_EXISTS` | 409 | Email in Firebase |
| `REGISTRATION_FAILED` | 400 | General registration error |
| `LOGIN_FAILED` | 400 | General login error |
| `TENANT_VERIFICATION_PENDING` | 401 | Tenant not approved |
| `TOKEN_MISMATCH` | 401 | Token/tenant mismatch |

### Error Response Format

```json
{
  "statusCode": 409,
  "message": "Company already exists",
  "errors": [
    {
      "code": "COMPANY_EXISTS",
      "message": "A tenant for this company already exists"
    }
  ]
}
```

### Example: Registration Conflict

**Request:**
```json
{
  "company_name": "Acme Corporation",
  "email": "jane@acme.com",
  "password": "Pass123!"
}
```

**Response (409):**
```json
{
  "statusCode": 409,
  "message": "Company already exists",
  "errors": [
    {
      "code": "COMPANY_EXISTS",
      "message": "A tenant for this company already exists"
    }
  ]
}
```

### Example: Invalid Login

**Request:**
```json
{
  "email": "wrong@example.com",
  "password": "WrongPass"
}
```

**Response (404):**
```json
{
  "statusCode": 404,
  "message": "Tenant not found for provided email",
  "errors": [
    {
      "code": "TENANT_NOT_FOUND_FOR_EMAIL",
      "message": "No tenant associated with email wrong@example.com"
    }
  ]
}
```

---

## Security Considerations

### 1. Password Requirements
- Minimum 6 characters (enforced by validation)
- Stored securely in Firebase (never in database)

### 2. Token Security
- **Custom Token**: Short-lived, single-use for Firebase sign-in
- **ID Token**: Signed by Firebase, verified on each request
- **Refresh Token**: Used to get new ID tokens

### 3. Tenant Isolation
- Firebase tenant separation prevents cross-tenant authentication
- Database schema isolation prevents data leakage
- Guards verify token matches tenant context

### 4. Role-Based Access
- Users assigned roles during registration
- First user becomes owner automatically
- Guards enforce role requirements

### 5. Tenant Status
- `pending`: Awaiting admin approval
- `approved`: Fully active
- Non-super_admin users blocked if tenant not approved

---

## Summary

The AirSpot API authentication system provides:

✅ **Multi-tenant isolation** via Firebase tenants + PostgreSQL schemas  
✅ **Secure authentication** using Firebase ID tokens  
✅ **Automatic tenant provisioning** during registration  
✅ **Role-based access control** with default roles  
✅ **Scalable architecture** supporting multiple organizations  
✅ **Comprehensive error handling** with descriptive codes  

**Registration** creates a complete organization with owner user.  
**Login** authenticates users within their tenant context.  
**Guards** protect routes and enforce tenant + role requirements.

For detailed API usage, see [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md).
