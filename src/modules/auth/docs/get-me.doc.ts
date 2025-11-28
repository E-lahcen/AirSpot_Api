import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

export function ApiGetMe() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get current user profile',
      description:
        'Retrieves the profile information of the authenticated user.',
    }),
    ApiResponse({
      status: 200,
      description: 'User retrieved successfully',
      schema: {
        example: {
          statusCode: 200,
          message: 'User retrieved successfully',
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'john.doe@acme.com',
            full_name: 'John Doe',
            first_name: 'John',
            last_name: 'Doe',
            company_name: 'Acme Corporation',
            firebase_uid: 'firebase-uid-123',
            created_at: '2025-11-23T16:00:00.000Z',
            updated_at: '2025-11-23T16:00:00.000Z',
            roles: [
              {
                id: 'role-id-123',
                name: 'owner',
                description: 'Company owner with full administrative access',
              },
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing token',
    }),
  );
}
