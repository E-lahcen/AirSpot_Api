import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiGetAudience() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get an audience target by ID',
      description:
        'Retrieves detailed information about a specific audience targeting rule including its associated ad variation.',
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
      description: 'Audience target retrieved successfully',
      schema: {
        example: {
          statusCode: 200,
          message: 'Audience target retrieved successfully',
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            variation_id: '123e4567-e89b-12d3-a456-426614174001',
            type: 'LOCATION',
            target_id: 'US-CA',
            owner_id: '123e4567-e89b-12d3-a456-426614174002',
            organization_id: '123e4567-e89b-12d3-a456-426614174003',
            created_at: '2024-05-20T10:00:00.000Z',
            updated_at: '2024-05-20T10:00:00.000Z',
            ad_variation: {
              id: '123e4567-e89b-12d3-a456-426614174001',
              name: 'Mobile Banner - Variant A',
            },
          },
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
