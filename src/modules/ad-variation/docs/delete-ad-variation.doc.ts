import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiDeleteAdVariation() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete an ad variation',
      description:
        'Permanently deletes an ad variation and all its associated data. This action cannot be undone.',
    }),
    ApiSecurity('x-tenant-slug'),
    ApiParam({
      name: 'id',
      type: String,
      description: 'Ad Variation UUID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Ad variation deleted successfully',
      schema: {
        example: {
          statusCode: 200,
          message: 'Ad variation deleted successfully',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found - Ad variation does not exist',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
  );
}
