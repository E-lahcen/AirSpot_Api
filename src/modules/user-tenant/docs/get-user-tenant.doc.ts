import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiParam,
} from '@nestjs/swagger';

export function ApiGetUserTenant() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a specific user-tenant association',
      description: 'Retrieves a user-tenant association by ID',
    }),
    ApiSecurity('x-tenant-slug'),
    ApiParam({
      name: 'id',
      description: 'User-tenant association ID',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'User-tenant association retrieved successfully',
      schema: {
        example: {
          statusCode: 200,
          message: 'User-tenant association retrieved successfully',
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            user_id: '123e4567-e89b-12d3-a456-426614174001',
            tenant_id: '123e4567-e89b-12d3-a456-426614174002',
            created_at: '2025-01-20T10:00:00.000Z',
            updated_at: '2025-01-20T10:00:00.000Z',
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found - User-tenant association not found',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
  );
}
