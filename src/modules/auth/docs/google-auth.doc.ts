import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

export const ApiGoogleAuth = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Authenticate with Google',
      description: `
        Authenticate using Google OAuth. This endpoint handles both registration and login:
        
        **Registration (New Company):**
        - Don't provide organisationSubdomain
        - Creates a new tenant/organization based on email domain
        - User becomes the owner
        - No email verification required
        
        **Login (Existing Organization):**
        - Provide organisationSubdomain
        - Logs into existing tenant
        - Creates user if they don't exist in that tenant (with member role)
        - Existing users simply login
      `,
    }),
    ApiResponse({
      status: 200,
      description: 'Authentication successful',
      schema: {
        example: {
          message: 'Google authentication successful',
          statusCode: 200,
          data: {
            custom_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjU5N...',
            firebase_tenant_id: 'tenant-abc123',
            user: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              email: 'user@example.com',
              first_name: 'John',
              last_name: 'Doe',
              firebase_uid: 'firebase-uid-123',
              roles: [
                {
                  id: 1,
                  name: 'owner',
                  description: 'Organization owner',
                },
              ],
            },
            tenant: {
              id: '123e4567-e89b-12d3-a456-426614174001',
              company_name: 'example',
              subdomain: 'example',
              slug: 'example',
              firebase_tenant_id: 'tenant-abc123',
              status: 'pending',
              owner_id: '123e4567-e89b-12d3-a456-426614174000',
            },
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Invalid Google token or authentication failed',
      schema: {
        example: {
          message: 'Google authentication failed',
          statusCode: 400,
          errors: [
            {
              code: 'INVALID_GOOGLE_TOKEN',
              message: 'Google account does not have an email address',
            },
          ],
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Organisation not found',
      schema: {
        example: {
          message: 'Organisation not found',
          statusCode: 404,
          errors: [
            {
              code: 'TENANT_NOT_FOUND',
              message: 'No organisation found with this subdomain',
            },
          ],
        },
      },
    }),
    ApiConflictResponse({
      description: 'Company already exists',
      schema: {
        example: {
          message: 'Company already exists',
          statusCode: 409,
          errors: [
            {
              code: 'COMPANY_EXISTS',
              message:
                'A tenant for this company already exists. Please use the login flow with your organisation subdomain.',
            },
          ],
        },
      },
    }),
  );
