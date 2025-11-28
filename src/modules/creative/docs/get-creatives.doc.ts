import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiGetCreatives() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all creatives with pagination and filters',
      description:
        'Retrieves a paginated list of creative assets with optional filtering by name, mime type, and owner.',
    }),
    ApiSecurity('x-tenant-slug'),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (default: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Items per page (default: 10, max: 100)',
      example: 10,
    }),
    ApiQuery({
      name: 'name',
      required: false,
      type: String,
      description: 'Filter by creative name (partial match)',
      example: 'Banner',
    }),
    ApiQuery({
      name: 'mime_type',
      required: false,
      type: String,
      description: 'Filter by MIME type (partial match)',
      example: 'image/jpeg',
    }),
    ApiQuery({
      name: 'owner_id',
      required: false,
      type: String,
      description: 'Filter by owner user ID',
    }),
    ApiResponse({
      status: 200,
      description: 'Creatives retrieved successfully',
      schema: {
        example: {
          statusCode: 200,
          message: 'Creatives retrieved successfully',
          data: {
            items: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Summer Banner',
                url: 'https://cdn.example.com/creatives/summer-banner.jpg',
                mime_type: 'image/jpeg',
                file_size: 245760,
                width: 1200,
                height: 628,
                owner_id: '123e4567-e89b-12d3-a456-426614174001',
                created_at: '2024-05-20T10:00:00.000Z',
              },
            ],
            meta: {
              totalItems: 50,
              itemCount: 10,
              itemsPerPage: 10,
              totalPages: 5,
              currentPage: 1,
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
  );
}
