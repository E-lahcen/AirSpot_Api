import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiGetAudiences() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all audience targets with pagination and filters',
      description:
        'Retrieves a paginated list of audience targeting rules with optional filtering by ad variation, type, target ID, and owner.',
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
      name: 'variation_id',
      required: false,
      type: String,
      description: 'Filter by ad variation ID',
    }),
    ApiQuery({
      name: 'type',
      required: false,
      enum: ['LOCATION', 'INTEREST', 'DEMOGRAPHIC', 'BEHAVIOR', 'CUSTOM'],
      description: 'Filter by targeting type',
    }),
    ApiQuery({
      name: 'target_id',
      required: false,
      type: String,
      description: 'Filter by target ID',
    }),
    ApiQuery({
      name: 'owner_id',
      required: false,
      type: String,
      description: 'Filter by owner user ID',
    }),
    ApiResponse({
      status: 200,
      description: 'Audience targets retrieved successfully',
      schema: {
        example: {
          statusCode: 200,
          message: 'Audience targets retrieved successfully',
          data: {
            items: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                variation_id: '123e4567-e89b-12d3-a456-426614174001',
                type: 'LOCATION',
                target_id: 'US-CA',
                owner_id: '123e4567-e89b-12d3-a456-426614174002',
                created_at: '2024-05-20T10:00:00.000Z',
                ad_variation: {
                  id: '123e4567-e89b-12d3-a456-426614174001',
                  name: 'Mobile Banner - Variant A',
                },
              },
            ],
            meta: {
              totalItems: 30,
              itemCount: 10,
              itemsPerPage: 10,
              totalPages: 3,
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
