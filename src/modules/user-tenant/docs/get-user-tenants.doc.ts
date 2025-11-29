import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiQuery,
} from '@nestjs/swagger';

export function ApiGetUserTenants() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all user-tenant associations',
      description:
        'Retrieves a paginated list of user-tenant associations with optional filtering',
    }),
    ApiSecurity('x-tenant-slug'),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (default: 1)',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Items per page (default: 10)',
    }),
    ApiQuery({
      name: 'user_id',
      required: false,
      type: String,
      description: 'Filter by user ID',
    }),
    ApiQuery({
      name: 'tenant_id',
      required: false,
      type: String,
      description: 'Filter by tenant ID',
    }),
    ApiResponse({
      status: 200,
      description: 'User-tenant associations retrieved successfully',
      schema: {
        example: {
          statusCode: 200,
          message: 'User-tenant associations retrieved successfully',
          data: {
            items: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                user_id: '123e4567-e89b-12d3-a456-426614174001',
                tenant_id: '123e4567-e89b-12d3-a456-426614174002',
                created_at: '2025-01-20T10:00:00.000Z',
                updated_at: '2025-01-20T10:00:00.000Z',
              },
            ],
            meta: {
              itemCount: 1,
              totalItems: 1,
              itemsPerPage: 10,
              totalPages: 1,
              currentPage: 1,
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
  );
}
