import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { UpdateUserTenantDto } from '../dtos/update-user-tenant.dto';

export function ApiUpdateUserTenant() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a user-tenant association',
      description: 'Updates user and/or tenant in an association',
    }),
    ApiSecurity('x-tenant-slug'),
    ApiParam({
      name: 'id',
      description: 'User-tenant association ID',
      type: String,
    }),
    ApiBody({ type: UpdateUserTenantDto }),
    ApiResponse({
      status: 200,
      description: 'User-tenant association updated successfully',
      schema: {
        example: {
          statusCode: 200,
          message: 'User-tenant association updated successfully',
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
      status: 400,
      description: 'Bad Request - Invalid input data',
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
