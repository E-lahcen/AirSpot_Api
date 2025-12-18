# Google OAuth Authentication Integration Guide

This guide explains how Google OAuth authentication has been integrated into the AirSpot API.

## Overview

Google OAuth allows users to register and login without email verification. The integration supports two flows:

1. **New Company Registration**: Users can create a new organization using their Google account
2. **Existing Organization Login**: Users can join or login to an existing organization

## Features

- ✅ No email verification required (Google already verifies emails)
- ✅ Automatic user creation from Google profile
- ✅ Support for multi-tenant architecture
- ✅ Seamless integration with existing Firebase authentication
- ✅ Handles both registration and login in a single endpoint

## Architecture

### Files Created/Modified

**New Files:**
- `src/modules/auth/strategies/google.strategy.ts` - Passport Google OAuth strategy
- `src/modules/auth/guards/google-auth.guard.ts` - Google authentication guard
- `src/modules/auth/dto/google-auth.dto.ts` - DTO for Google auth requests
- `src/modules/auth/docs/google-auth.doc.ts` - Swagger documentation
- `GOOGLE_AUTH_INTEGRATION.md` - This file

**Modified Files:**
- `src/modules/auth/auth.module.ts` - Added Google strategy and Passport module
- `src/modules/auth/controllers/auth.controller.ts` - Added Google auth endpoint
- `src/modules/auth/services/auth.service.ts` - Added Google auth methods
- `src/modules/auth/guards/index.ts` - Exported Google auth guard
- `src/modules/auth/docs/index.ts` - Exported Google auth docs
- `src/core/validators/env.validator.ts` - Added Google OAuth env variables

## Environment Variables

Add these to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

### Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen if you haven't already
6. Set Application Type to "Web application"
7. Add authorized redirect URIs:
   - Development: `http://localhost:3000/auth/google/callback`
   - Production: `https://yourdomain.com/auth/google/callback`
8. Copy the Client ID and Client Secret

## API Endpoint

### POST `/auth/google`

Authenticate using Google OAuth. Handles both registration and login.

**Request Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjU5N...",
  "organisationSubdomain": "acme-corp" // Optional
}
```

**Response (Success):**
```json
{
  "message": "Google authentication successful",
  "statusCode": 200,
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjU5N...",
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "firebase_uid": "firebase-uid-123",
      "roles": [
        {
          "id": 1,
          "name": "owner",
          "description": "Organization owner"
        }
      ]
    },
    "tenant": {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "company_name": "example",
      "subdomain": "example",
      "firebase_tenant_id": "tenant-abc123",
      "status": "pending",
      "owner_id": "123e4567-e89b-12d3-a456-426614174000"
    }
  }
}
```

## Flow Details

### Flow 1: New Company Registration

When `organisationSubdomain` is **not** provided:

1. User clicks "Sign in with Google" on frontend
2. Frontend gets Google ID token using Google Sign-In SDK
3. Frontend sends ID token to `/auth/google` endpoint (without subdomain)
4. Backend verifies the Google ID token
5. Backend extracts email domain (e.g., `user@example.com` → `example`)
6. Backend checks if company already exists
7. Backend creates:
   - New Firebase tenant
   - New database tenant/organization
   - New user with "owner" role
8. Backend returns access token and user data

**Use Case:** First user from a company signing up

### Flow 2: Existing Organization Login

When `organisationSubdomain` **is** provided:

1. User enters their organization subdomain on login page
2. User clicks "Sign in with Google"
3. Frontend gets Google ID token
4. Frontend sends ID token + subdomain to `/auth/google`
5. Backend verifies the Google ID token
6. Backend finds the tenant by subdomain
7. Backend checks if user exists in that tenant:
   - **If exists:** Login the user
   - **If not exists:** Create user with "member" role
8. Backend returns access token and user data

**Use Cases:**
- Team member joining existing organization
- Existing user logging in

## Frontend Integration

### Using Google Sign-In SDK

```typescript
// 1. Add Google Sign-In script to your HTML
<script src="https://accounts.google.com/gsi/client" async defer></script>

// 2. Initialize Google Sign-In
import { environment } from './environments/environment';

// For New Company Registration
async function signInWithGoogleNewCompany() {
  try {
    // Get Google credential
    const credential = await googleSignIn();
    
    // Send to backend
    const response = await fetch('/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: credential.id_token
      })
    });
    
    const data = await response.json();
    // Store access token and redirect
    localStorage.setItem('access_token', data.data.access_token);
    window.location.href = '/dashboard';
  } catch (error) {
    console.error('Google sign-in failed:', error);
  }
}

// For Login to Existing Organization
async function signInWithGoogleExisting(subdomain: string) {
  try {
    const credential = await googleSignIn();
    
    const response = await fetch('/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: credential.id_token,
        organisationSubdomain: subdomain
      })
    });
    
    const data = await response.json();
    localStorage.setItem('access_token', data.data.access_token);
    window.location.href = '/dashboard';
  } catch (error) {
    console.error('Google sign-in failed:', error);
  }
}

// Google Sign-In helper
function googleSignIn(): Promise<any> {
  return new Promise((resolve, reject) => {
    google.accounts.id.initialize({
      client_id: 'YOUR_GOOGLE_CLIENT_ID',
      callback: (response) => {
        if (response.credential) {
          resolve({ id_token: response.credential });
        } else {
          reject(new Error('No credential received'));
        }
      }
    });
    
    google.accounts.id.prompt();
  });
}
```

### Using Firebase Auth with Google

Alternatively, if you're using Firebase on the frontend:

```typescript
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

async function signInWithGoogle(subdomain?: string) {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  
  try {
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
    
    const response = await fetch('/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: idToken,
        organisationSubdomain: subdomain // Optional
      })
    });
    
    const data = await response.json();
    // Store and use access token
    localStorage.setItem('access_token', data.data.access_token);
  } catch (error) {
    console.error('Google sign-in failed:', error);
  }
}
```

## Error Handling

The endpoint returns structured errors:

### Invalid Google Token
```json
{
  "message": "Google authentication failed",
  "statusCode": 400,
  "errors": [
    {
      "code": "INVALID_GOOGLE_TOKEN",
      "message": "Google account does not have an email address"
    }
  ]
}
```

### Organization Not Found
```json
{
  "message": "Organisation not found",
  "statusCode": 404,
  "errors": [
    {
      "code": "TENANT_NOT_FOUND",
      "message": "No organisation found with this subdomain"
    }
  ]
}
```

### Company Already Exists
```json
{
  "message": "Company already exists",
  "statusCode": 409,
  "errors": [
    {
      "code": "COMPANY_EXISTS",
      "message": "A tenant for this company already exists. Please use the login flow with your organisation subdomain."
    }
  ]
}
```

## Testing

### Using Postman/Curl

1. Get a Google ID token (use Google OAuth Playground or your frontend)
2. Test registration:
```bash
curl -X POST http://localhost:3000/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "YOUR_GOOGLE_ID_TOKEN"
  }'
```

3. Test login to existing org:
```bash
curl -X POST http://localhost:3000/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "YOUR_GOOGLE_ID_TOKEN",
    "organisationSubdomain": "acme-corp"
  }'
```

## Security Considerations

1. **Token Verification**: Google ID tokens are verified using Firebase Admin SDK
2. **Email Verification**: Not required as Google already verifies emails
3. **Tenant Isolation**: Multi-tenant architecture ensures data isolation
4. **Role Assignment**: 
   - First user (company creator) gets "owner" role
   - Subsequent users get "member" role
5. **HTTPS**: Use HTTPS in production for secure token transmission

## Troubleshooting

### Error: "Invalid Google token"
- Ensure your Google Client ID is correct
- Check if the ID token hasn't expired (tokens expire after 1 hour)
- Verify the token was issued for your Client ID

### Error: "Organization not found"
- Check if the subdomain is correct
- Verify the tenant exists in your database

### Error: "Company already exists"
- This means a user from this email domain already created an organization
- User should use the login flow with the organization's subdomain

## Next Steps

1. **Frontend Implementation**: Integrate Google Sign-In button on your login/register pages
2. **UI/UX**: Design the organization subdomain input flow
3. **Testing**: Test with different Google accounts
4. **Production**: Update callback URLs and deploy

## Benefits Over Email/Password

- ✅ **No email verification needed**: Google already verifies emails
- ✅ **Better UX**: One-click authentication
- ✅ **More secure**: No password to store or manage
- ✅ **Social proof**: Users trust Google authentication
- ✅ **Faster onboarding**: Reduces friction in signup process

## Limitations

- Users without Google accounts cannot use this method
- Requires internet connection to verify tokens
- Dependent on Google services availability

## Support

For issues or questions:
1. Check Firebase console for authentication logs
2. Review application logs for detailed error messages
3. Verify Google Cloud Console settings
4. Ensure all environment variables are set correctly
