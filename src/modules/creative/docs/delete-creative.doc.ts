import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiDeleteCreative() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete a creative',
      description:
        'Permanently deletes a creative asset. This action cannot be undone.',
    }),
    ApiSecurity('x-tenant-slug'),
    ApiParam({
      name: 'id',
      type: String,
      description: 'Creative UUID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Creative deleted successfully',
      schema: {
        example: {
          statusCode: 200,
          message: 'Creative deleted successfully',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found - Creative does not exist',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
  );
}
