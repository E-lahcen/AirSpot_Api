# Google OAuth Quick Start Guide

## Prerequisites
- ✅ Dependencies installed: `passport`, `passport-google-oauth20`, `@nestjs/passport`
- ✅ Google Cloud project created
- ✅ OAuth 2.0 credentials configured

## Step 1: Set Up Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable **Google+ API** (or Google Identity)
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - User Type: External (for testing) or Internal (for organization)
   - App name: Your app name
   - User support email: Your email
   - Authorized domains: Your domain
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: Your app name
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/google/callback` (development)
     - `https://yourdomain.com/auth/google/callback` (production)
7. Copy **Client ID** and **Client Secret**

## Step 2: Configure Environment Variables

Add to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcd1234efgh5678ijkl
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

## Step 3: Test the Integration

### Option A: Using Postman

1. Get a Google ID Token:
   - Go to [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
   - Select "Google OAuth2 API v2" → "userinfo.email" and "userinfo.profile"
   - Click "Authorize APIs"
   - Exchange authorization code for tokens
   - Copy the `id_token`

2. Test Registration (New Company):
   ```http
   POST http://localhost:3000/auth/google
   Content-Type: application/json

   {
     "idToken": "YOUR_GOOGLE_ID_TOKEN"
   }
   ```

3. Test Login (Existing Organization):
   ```http
   POST http://localhost:3000/auth/google
   Content-Type: application/json

   {
     "idToken": "YOUR_GOOGLE_ID_TOKEN",
     "organisationSubdomain": "acme-corp"
   }
   ```

### Option B: Using Frontend

#### Simple HTML/JavaScript Example:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Google Sign-In Test</title>
    <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body>
    <h1>Google OAuth Test</h1>
    
    <!-- Google Sign-In Button -->
    <div id="g_id_onload"
         data-client_id="YOUR_GOOGLE_CLIENT_ID"
         data-callback="handleCredentialResponse">
    </div>
    <div class="g_id_signin" data-type="standard"></div>

    <script>
        async function handleCredentialResponse(response) {
            console.log("Google ID Token:", response.credential);
            
            try {
                // Test registration (new company)
                const res = await fetch('http://localhost:3000/auth/google', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        idToken: response.credential
                    })
                });
                
                const data = await res.json();
                console.log("Response:", data);
                
                if (data.data && data.data.access_token) {
                    alert('Login successful!');
                    console.log('Access Token:', data.data.access_token);
                    console.log('User:', data.data.user);
                    console.log('Tenant:', data.data.tenant);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Login failed: ' + error.message);
            }
        }
    </script>
</body>
</html>
```

#### React/TypeScript Example:

```typescript
import React from 'react';

// Install: npm install @react-oauth/google
import { GoogleLogin } from '@react-oauth/google';

function GoogleAuthButton() {
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const response = await fetch('http://localhost:3000/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: credentialResponse.credential,
          // organisationSubdomain: 'acme-corp' // Optional: for existing org
        }),
      });

      const data = await response.json();
      
      if (data.data?.access_token) {
        // Store token
        localStorage.setItem('access_token', data.data.access_token);
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={() => {
        console.log('Login Failed');
      }}
    />
  );
}

export default GoogleAuthButton;
```

## Step 4: Verify in Swagger

1. Start your application:
   ```bash
   npm run start:dev
   ```

2. Open Swagger UI: `http://localhost:3000/api`

3. Find the **POST /auth/google** endpoint under "Authentication"

4. Try it out with a Google ID token

## Step 5: Check Database

After successful registration, verify:

1. **Tenants table**: New tenant created
2. **Users table** (in tenant schema): New user created
3. **User roles**: User assigned "owner" or "member" role

```sql
-- Check tenants
SELECT * FROM tenants ORDER BY created_at DESC LIMIT 5;

-- Check user in tenant schema (replace 'tenant_xxx' with actual schema)
SELECT * FROM tenant_xxx.users ORDER BY created_at DESC LIMIT 5;

-- Check user roles
SELECT u.email, r.name as role 
FROM tenant_xxx.users u
JOIN tenant_xxx.user_roles ur ON u.id = ur.user_id
JOIN tenant_xxx.roles r ON ur.role_id = r.id;
```

## Common Flows

### Flow 1: New User Creates Company
```
User → Click "Sign in with Google" → Google Login → 
Get ID Token → POST /auth/google (no subdomain) →
Create Tenant + User (owner) → Return access token
```

### Flow 2: User Joins Existing Company
```
User → Enter organization subdomain → Click "Sign in with Google" →
Google Login → Get ID Token → POST /auth/google (with subdomain) →
Find Tenant → Create/Login User → Return access token
```

### Flow 3: Existing User Logs In
```
User → Enter organization subdomain → Click "Sign in with Google" →
Google Login → Get ID Token → POST /auth/google (with subdomain) →
Find Tenant + User → Return access token
```

## Troubleshooting

### Error: "Cannot find module 'passport'"
```bash
npm install passport passport-google-oauth20 @nestjs/passport
npm install -D @types/passport-google-oauth20
```

### Error: "GOOGLE_CLIENT_ID is not defined"
- Check your `.env` file
- Ensure environment variables are loaded
- Restart your application

### Error: "Invalid Google token"
- Token may be expired (they expire after 1 hour)
- Get a fresh token from Google
- Verify Client ID matches your Google Cloud project

### Error: "redirect_uri_mismatch"
- Check authorized redirect URIs in Google Cloud Console
- Ensure they match exactly (including http/https)

### Error: "Company already exists"
- This email domain already has a tenant
- Use login flow with organization subdomain instead

## Security Checklist

- [ ] HTTPS enabled in production
- [ ] Google Client Secret kept secure (not in client-side code)
- [ ] Environment variables properly configured
- [ ] OAuth consent screen configured
- [ ] Authorized redirect URIs set correctly
- [ ] Token verification enabled (done automatically)

## Next Steps

1. **Frontend Integration**: Add Google Sign-In button to your app
2. **User Experience**: Design organization subdomain flow
3. **Testing**: Test with multiple Google accounts
4. **Production**: Update redirect URIs for production domain
5. **Monitoring**: Set up logging for authentication events

## API Reference

### Endpoint
```
POST /auth/google
```

### Request Body
```typescript
{
  idToken: string;           // Required: Google ID token
  organisationSubdomain?: string;  // Optional: for existing org login
}
```

### Response
```typescript
{
  message: string;
  statusCode: number;
  data: {
    access_token: string;
    user: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      firebase_uid: string;
      roles: Role[];
    };
    tenant: {
      id: string;
      company_name: string;
      subdomain: string;
      firebase_tenant_id: string;
      status: string;
      owner_id?: string;
    };
  };
}
```

## Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In for Websites](https://developers.google.com/identity/sign-in/web)
- [Passport Google OAuth Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)
- [NestJS Passport Integration](https://docs.nestjs.com/security/authentication)

## Support

If you encounter issues:
1. Check application logs
2. Verify Google Cloud Console settings
3. Test with Google OAuth Playground
4. Review environment variables
5. Check Firebase console for errors
