import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { CreateCreativeDto } from '../dto';

export function ApiCreateCreative() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new creative',
      description:
        'Creates a new creative asset (image, video, or other media) for use in ad variations.',
    }),
    ApiSecurity('x-tenant-slug'),
    ApiBody({ type: CreateCreativeDto }),
    ApiResponse({
      status: 201,
      description: 'Creative created successfully',
      schema: {
        example: {
          statusCode: 201,
          message: 'Creative created successfully',
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
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid input data',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
  );
}
