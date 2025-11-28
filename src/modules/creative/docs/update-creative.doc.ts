import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { UpdateCreativeDto } from '../dto';

export function ApiUpdateCreative() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a creative',
      description:
        'Updates an existing creative asset with new information. All fields are optional.',
    }),
    ApiSecurity('x-tenant-slug'),
    ApiParam({
      name: 'id',
      type: String,
      description: 'Creative UUID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({ type: UpdateCreativeDto }),
    ApiResponse({
      status: 200,
      description: 'Creative updated successfully',
      schema: {
        example: {
          statusCode: 200,
          message: 'Creative updated successfully',
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Summer Banner - Updated',
            url: 'https://cdn.example.com/creatives/summer-banner-v2.jpg',
            mime_type: 'image/jpeg',
            file_size: 245760,
            width: 1200,
            height: 628,
            owner_id: '123e4567-e89b-12d3-a456-426614174001',
            organization_id: '123e4567-e89b-12d3-a456-426614174002',
            created_at: '2024-05-20T10:00:00.000Z',
            updated_at: '2024-06-15T14:30:00.000Z',
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
      description: 'Not Found - Creative does not exist',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
  );
}
