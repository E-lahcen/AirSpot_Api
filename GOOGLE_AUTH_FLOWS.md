# Google OAuth Authentication Flows

## Visual Flow Diagrams

### Flow 1: New Company Registration (First User)

```
┌─────────────┐
│   User      │
│  (Frontend) │
└──────┬──────┘
       │
       │ 1. Click "Sign in with Google"
       ▼
┌─────────────┐
│   Google    │
│  Auth Page  │
└──────┬──────┘
       │
       │ 2. User authenticates
       ▼
┌─────────────┐
│  Frontend   │
│ Receives ID │
│   Token     │
└──────┬──────┘
       │
       │ 3. POST /auth/google
       │    { idToken: "..." }
       │    (no organisationSubdomain)
       ▼
┌─────────────┐
│  Backend    │
│  Auth API   │
└──────┬──────┘
       │
       │ 4. Verify Google ID Token
       ▼
┌─────────────┐
│  Firebase   │
│   Admin     │
└──────┬──────┘
       │
       │ 5. Token valid ✓
       ▼
┌─────────────┐
│  Backend    │
│  Extracts   │
│    email    │
│   domain    │
└──────┬──────┘
       │
       │ 6. Check if company exists
       ▼
┌─────────────┐
│  Database   │
│   Tenant    │
│   Check     │
└──────┬──────┘
       │
       │ 7. Company doesn't exist ✓
       ▼
┌─────────────┐
│  Create     │
│  Firebase   │
│   Tenant    │
└──────┬──────┘
       │
       │ 8. Create DB Tenant
       ▼
┌─────────────┐
│  Create     │
│  Tenant     │
│  Schema     │
└──────┬──────┘
       │
       │ 9. Create User (Owner Role)
       ▼
┌─────────────┐
│  Generate   │
│  Access     │
│   Token     │
└──────┬──────┘
       │
       │ 10. Return Response
       ▼
┌─────────────┐
│  Frontend   │
│  Stores     │
│   Token     │
└──────┬──────┘
       │
       │ 11. Redirect to Dashboard
       ▼
┌─────────────┐
│  Dashboard  │
│   (Owner)   │
└─────────────┘
```

### Flow 2: Login to Existing Organization

```
┌─────────────┐
│   User      │
│  (Frontend) │
└──────┬──────┘
       │
       │ 1. Enter organization subdomain
       │    e.g., "acme-corp"   
       ▼
┌─────────────┐
│  Frontend   │
│  Stores     │
│  Subdomain  │
└──────┬──────┘
       │
       │ 2. Click "Sign in with Google"
       ▼
┌─────────────┐
│   Google    │
│  Auth Page  │
└──────┬──────┘
       │
       │ 3. User authenticates
       ▼
┌─────────────┐
│  Frontend   │
│ Receives ID │
│   Token     │
└──────┬──────┘
       │
       │ 4. POST /auth/google
       │    { 
       │      idToken: "...",
       │      organisationSubdomain: "acme-corp"
       │    }
       ▼
┌─────────────┐
│  Backend    │
│  Auth API   │
└──────┬──────┘
       │
       │ 5. Verify Google ID Token
       ▼
┌─────────────┐
│  Firebase   │
│   Admin     │
└──────┬──────┘
       │
       │ 6. Token valid ✓
       ▼
┌─────────────┐
│  Backend    │
│  Find Tenant│
│  by Sub-    │
│  domain     │
└──────┬──────┘
       │
       │ 7. Tenant found ✓
       ▼
┌─────────────┐
│  Set Tenant │
│  Context    │
└──────┬──────┘
       │
       │ 8. Check if user exists
       ▼
    ┌──┴──┐
    │     │
User      User
Exists    Doesn't
    │     Exist
    │     │
    │     │ 9a. Create User (Member Role)
    │     ▼
    │  ┌─────────────┐
    │  │  Create     │
    │  │  Firebase   │
    │  │  User in    │
    │  │  Tenant     │
    │  └──────┬──────┘
    │         │
    └─────────┤
              │
              │ 10. Generate Access Token
              ▼
        ┌─────────────┐
        │  Return     │
        │  Response   │
        │  with Token │
        └──────┬──────┘
               │
               │ 11. Frontend stores token
               ▼
        ┌─────────────┐
        │  Redirect   │
        │  to         │
        │  Dashboard  │
        └─────────────┘
```

### Flow 3: Error Handling Flow

```
┌─────────────┐
│  POST       │
│ /auth/google│
└──────┬──────┘
       │
       ▼
    Verify
    Token
       │
    ┌──┴──────────────────┐
    │                     │
  Valid              Invalid
    │                     │
    ▼                     ▼
  Continue        ┌─────────────┐
    │             │  Return     │
    │             │  400 Error  │
    │             │  INVALID_   │
    │             │  TOKEN      │
    │             └─────────────┘
    ▼
Extract Email
    │
    ▼
Subdomain
Provided?
    │
  ┌─┴─────────────────┐
  │                   │
 YES                 NO
  │                   │
  ▼                   ▼
Find            Extract
Tenant          Company
  │             from Email
  │                   │
  ▼                   ▼
Tenant          Company
Exists?         Exists?
  │                   │
┌─┴──┐            ┌───┴──┐
│    │            │      │
Yes  No           Yes    No
│    │            │      │
│    ▼            │      │
│  Return         │      │
│  404            │      │
│  TENANT_        │      │
│  NOT_FOUND      │      │
│                 ▼      │
│              Return    │
│              409       │
│              COMPANY_  │
│              EXISTS    │
│                        │
▼                        ▼
Continue            Continue
Create/Login        Create New
User                Tenant
```

## Sequence Diagrams

### New Company Registration Sequence

```
User         Frontend       Backend        Firebase       Database
 │              │              │              │              │
 │──Click───────▶              │              │              │
 │  Google                     │              │              │
 │              │──Popup───────▶              │              │
 │              │  Google                     │              │
 │              │  Login                      │              │
 │◀─Authorize───┤              │              │              │
 │              │◀─ID Token────┤              │              │
 │              │              │              │              │
 │              │──POST────────▶              │              │
 │              │  /auth/google               │              │
 │              │  {idToken}                  │              │
 │              │              │              │              │
 │              │              │──Verify──────▶              │
 │              │              │  Token                      │
 │              │              │◀─Valid───────┤              │
 │              │              │              │              │
 │              │              │──────────────────Check──────▶
 │              │              │              │  Company     │
 │              │              │◀─────────────────Not Exists─┤
 │              │              │              │              │
 │              │              │──Create──────▶              │
 │              │              │  Tenant                     │
 │              │              │◀─Created─────┤              │
 │              │              │              │              │
 │              │              │──────────────────Create─────▶
 │              │              │              │  Tenant      │
 │              │              │              │  + Schema    │
 │              │              │◀─────────────────Created────┤
 │              │              │              │              │
 │              │              │──────────────────Create─────▶
 │              │              │              │  User        │
 │              │              │              │  (Owner)     │
 │              │              │◀─────────────────Created────┤
 │              │              │              │              │
 │              │              │──Generate────▶              │
 │              │              │  Token                      │
 │              │              │◀─Token───────┤              │
 │              │              │              │              │
 │              │◀─Response────┤              │              │
 │              │  {token, user, tenant}      │              │
 │              │              │              │              │
 │◀─Login────── │              │              │              │
 │  Success                    │              │              │
 │              │              │              │              │
```

### Existing Organization Login Sequence

```
User         Frontend       Backend        Firebase       Database
 │              │              │              │              │
 │──Enter───────▶              │              │              │
 │  Subdomain                  │              │              │
 │              │              │              │              │
 │──Click───────▶              │              │              │
 │  Google                     │              │              │
 │              │──Popup───────▶              │              │
 │              │  Google                     │              │
 │◀─Authorize───┤              │              │              │
 │              │◀─ID Token────┤              │              │
 │              │              │              │              │
 │              │──POST────────▶              │              │
 │              │  /auth/google               │              │
 │              │  {idToken, subdomain}       │              │
 │              │              │              │              │
 │              │              │──Verify──────▶              │
 │              │              │  Token                      │
 │              │              │◀─Valid───────┤              │
 │              │              │              │              │
 │              │              │──────────────────Find───────▶
 │              │              │              │  Tenant      │
 │              │              │◀─────────────────Found──────┤
 │              │              │              │              │
 │              │              │──────────────────Find───────▶
 │              │              │              │  User        │
 │              │              │◀─────────────────Result─────┤
 │              │              │              │              │
 │              │              │  [If user not exists]       │
 │              │              │──Create──────▶              │
 │              │              │  Firebase                   │
 │              │              │  User                       │
 │              │              │◀─Created─────┤              │
 │              │              │              │              │
 │              │              │──────────────────Create─────▶
 │              │              │              │  User        │
 │              │              │              │  (Member)    │
 │              │              │◀─────────────────Created────┤
 │              │              │              │              │
 │              │              │──Generate────▶              │
 │              │              │  Token                      │
 │              │              │◀─Token───────┤              │
 │              │              │              │              │
 │              │◀─Response────┤              │              │
 │              │  {token, user, tenant}      │              │
 │              │              │              │              │
 │◀─Login────── │              │              │              │
 │  Success                    │              │              │
```

## Decision Tree

```
                    POST /auth/google
                           │
                           ▼
                    Verify ID Token
                           │
                    ┌──────┴──────┐
                    │             │
                  Valid       Invalid
                    │             │
                    │             └──▶ 400 Error
                    ▼
              Extract Email
                    │
                    ▼
        organisationSubdomain provided?
                    │
          ┌─────────┴─────────┐
          │                   │
         YES                  NO
          │                   │
          ▼                   ▼
    Find Tenant      Extract Company Name
    by Subdomain     from Email Domain
          │                   │
          ├─Found?            ├─Exists?
          │                   │
    ┌─────┴─────┐       ┌─────┴─────┐
    │           │       │           │
   Yes          No     Yes          No
    │           │       │           │
    │           └──▶ 404│           └──▶ Create
    │               Error│               New Tenant
    ▼                    └──▶ 409           │
Set Tenant                   Error          │
Context                                     │
    │                                       │
    ▼                                       ▼
User Exists                         Create Tenant
in Tenant?                          + User (Owner)
    │                                       │
┌───┴───┐                                   │
│       │                                   │
Yes     No                                  │
│       │                                   │
│       └──▶ Create User (Member)          │
│                  │                        │
└──────────────────┴────────────────────────┘
                   │
                   ▼
           Generate Access Token
                   │
                   ▼
           Return Success Response
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend App                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Login      │  │  Registration│  │   Dashboard     │  │
│  │   Page       │  │     Page     │  │     Page        │  │
│  └──────┬───────┘  └──────┬───────┘  └─────────────────┘  │
│         │                 │                                │
│         └─────────────────┴────────────┐                   │
│                                        │                   │
└────────────────────────────────────────┼───────────────────┘
                                         │
                                         │ HTTP POST
                                         │ /auth/google
                                         ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend API                          │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │              AuthController                        │    │
│  │  - POST /auth/google                              │    │
│  └─────────┬──────────────────────────────────────────┘    │
│            │                                               │
│            ▼                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │              AuthService                           │    │
│  │  - googleAuth()                                   │    │
│  │  - googleLoginToTenant()                          │    │
│  │  - googleRegisterNewTenant()                      │    │
│  └─────┬────────────────────────┬────────────────────┘    │
│        │                        │                          │
│        ▼                        ▼                          │
│  ┌──────────┐          ┌──────────────┐                   │
│  │  User    │          │   Tenant     │                   │
│  │  Service │          │   Service    │                   │
│  └────┬─────┘          └──────┬───────┘                   │
│       │                       │                            │
└───────┼───────────────────────┼────────────────────────────┘
        │                       │
        │                       │
        ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     External Services                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Firebase   │  │   Google     │  │   PostgreSQL    │  │
│  │   Admin SDK  │  │   OAuth      │  │   Database      │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## State Machine

```
                    ┌─────────────┐
                    │   Initial   │
                    │    State    │
                    └──────┬──────┘
                           │
                           │ User clicks
                           │ Google button
                           ▼
                  ┌─────────────────┐
                  │   Redirecting   │
                  │   to Google     │
                  └────────┬────────┘
                           │
                           │ Google auth
                           │ completes
                           ▼
                  ┌─────────────────┐
                  │   Received      │
                  │   ID Token      │
                  └────────┬────────┘
                           │
                           │ Send to backend
                           ▼
                  ┌─────────────────┐
                  │  Authenticating │
                  └────────┬────────┘
                           │
              ┌────────────┼────────────┐
              │                         │
            Success                  Failure
              │                         │
              ▼                         ▼
    ┌─────────────────┐        ┌─────────────────┐
    │  Authenticated  │        │   Auth Failed   │
    │   (Has Token)   │        │   Show Error    │
    └────────┬────────┘        └────────┬────────┘
             │                           │
             │ Store token               │ User retries
             │ Redirect                  │
             ▼                           ▼
    ┌─────────────────┐        ┌─────────────────┐
    │   Dashboard     │        │   Login Page    │
    │   (Logged In)   │        │                 │
    └─────────────────┘        └─────────────────┘
```
