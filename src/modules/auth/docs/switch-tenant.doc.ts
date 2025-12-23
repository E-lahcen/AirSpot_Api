import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

export const ApiSwitchTenant = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Switch to a different tenant/organization',
      description: `
        Allows an authenticated user to switch between organizations they have access to.
        Returns a new custom token and immediately exchanges it for an ID token and refresh token
        for the target tenant. Client should also set the 'x-tenant-slug' header to the switched
        organization's slug on subsequent requests.

        Steps:
        1. Verify user has access to target tenant
        2. Generate new custom token for target tenant
        3. Exchange for ID token and refresh token
        4. Use the returned ID token for Authorization and include 'x-tenant-slug' header
      `,
    }),
    ApiResponse({
      status: 200,
      description: 'Tenant switched successfully',
      schema: {
        example: {
          message: 'Tenant switched successfully',
          statusCode: 200,
          data: {
            custom_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjU5N...',
            id_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjU5N...',
            refresh_token: 'AEu4IL2...0F',
            expires_in: '3600',
            firebase_tenant_id: 'tenant-xyz789',
            user: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              email: 'user@example.com',
              first_name: 'John',
              last_name: 'Doe',
              firebase_uid: 'firebase-uid-123',
              roles: [
                {
                  id: 2,
                  name: 'member',
                  description: 'Organization member',
                },
              ],
            },
            tenant: {
              id: '987e6543-e89b-12d3-a456-426614174002',
              company_name: 'Another Company',
              slug: 'another-company',
              firebase_tenant_id: 'tenant-xyz789',
              is_active: true,
            },
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'User not authenticated or no access to target tenant',
      schema: {
        example: {
          message: 'Access denied',
          statusCode: 401,
          errors: [
            {
              code: 'NO_ACCESS',
              message: 'You do not have access to this organization',
            },
          ],
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Target tenant not found',
      schema: {
        example: {
          message: 'Tenant not found',
          statusCode: 404,
          errors: [
            {
              code: 'TENANT_NOT_FOUND',
              message: 'No tenant found with slug: invalid-slug',
            },
          ],
        },
      },
    }),
  );
