import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiGetCreative() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a creative by ID',
      description:
        'Retrieves detailed information about a specific creative asset by its unique identifier.',
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
      description: 'Creative retrieved successfully',
      schema: {
        example: {
          statusCode: 200,
          message: 'Creative retrieved successfully',
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Summer Banner',
            url: 'https://cdn.example.com/creatives/summer-banner.jpg',
            mime_type: 'image/jpeg',
            file_size: 245760,
            width: 1200,
            height: 628,
            owner_id: '123e4567-e89b-12d3-a456-426614174001',
            organization_id: '123e4567-e89b-12d3-a456-426614174002',
            created_at: '2024-05-20T10:00:00.000Z',
            updated_at: '2024-05-20T10:00:00.000Z',
            ad_variations: [],
          },
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
