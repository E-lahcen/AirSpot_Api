import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiParam,
} from '@nestjs/swagger';

export function ApiDeleteUserTenant() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete a user-tenant association',
      description: 'Removes a user-tenant association',
    }),
    ApiSecurity('x-tenant-slug'),
    ApiParam({
      name: 'id',
      description: 'User-tenant association ID',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'User-tenant association deleted successfully',
      schema: {
        example: {
          statusCode: 200,
          message: 'User-tenant association deleted successfully',
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
