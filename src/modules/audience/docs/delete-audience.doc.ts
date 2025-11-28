import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiDeleteAudience() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete an audience target',
      description:
        'Permanently deletes an audience targeting rule. This action cannot be undone.',
    }),
    ApiSecurity('x-tenant-slug'),
    ApiParam({
      name: 'id',
      type: String,
      description: 'Audience Target UUID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Audience target deleted successfully',
      schema: {
        example: {
          statusCode: 200,
          message: 'Audience target deleted successfully',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found - Audience target does not exist',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
  );
}
