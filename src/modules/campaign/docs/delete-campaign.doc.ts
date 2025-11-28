import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiDeleteCampaign() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete a campaign',
      description:
        'Permanently deletes a campaign and all its associated data. This action cannot be undone.',
    }),
    ApiSecurity('x-tenant-slug'),
    ApiParam({
      name: 'id',
      type: String,
      description: 'Campaign UUID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Campaign deleted successfully',
      schema: {
        example: {
          statusCode: 200,
          message: 'Campaign deleted successfully',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found - Campaign does not exist',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
  );
}
