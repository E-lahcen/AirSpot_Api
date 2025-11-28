import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { RegisterDto } from '../dto/register.dto';

export function ApiRegister() {
  return applyDecorators(
    ApiOperation({
      summary: 'Register a new user and create tenant',
      description:
        'Creates a new user account, Firebase tenant, and database tenant schema. The first user becomes the tenant owner.',
    }),
    ApiBody({ type: RegisterDto }),
    ApiResponse({
      status: 201,
      description: 'Account created successfully',
      schema: {
        example: {
          statusCode: 201,
          message: 'Account created successfully',
          data: {
            access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
            user: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              email: 'john.doe@acme.com',
              full_name: 'John Doe',
              company_name: 'Acme Corporation',
              firebase_uid: 'firebase-uid-123',
              created_at: '2025-11-23T16:00:00.000Z',
            },
            tenant: {
              id: '987fcdeb-51a2-43f7-8d9c-123456789abc',
              slug: 'acme-corporation',
              company_name: 'Acme Corporation',
              owner_id: '123e4567-e89b-12d3-a456-426614174000',
              is_active: true,
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid input data',
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict - Company already exists',
    }),
  );
}
