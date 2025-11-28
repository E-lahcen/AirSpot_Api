import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiGetAdVariations() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all ad variations with pagination and filters',
      description:
        'Retrieves a paginated list of ad variations with optional filtering by name, campaign, bidding strategy, and owner.',
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
      description: 'Filter by ad variation name (partial match)',
      example: 'Mobile',
    }),
    ApiQuery({
      name: 'campaign_id',
      required: false,
      type: String,
      description: 'Filter by campaign ID',
    }),
    ApiQuery({
      name: 'bidding_strategy',
      required: false,
      enum: ['CPC', 'CPM', 'CPA', 'CPV'],
      description: 'Filter by bidding strategy',
    }),
    ApiQuery({
      name: 'owner_id',
      required: false,
      type: String,
      description: 'Filter by owner user ID',
    }),
    ApiResponse({
      status: 200,
      description: 'Ad variations retrieved successfully',
      schema: {
        example: {
          statusCode: 200,
          message: 'Ad variations retrieved successfully',
          data: {
            items: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Mobile Banner - Variant A',
                campaign_id: '123e4567-e89b-12d3-a456-426614174001',
                creative_id: '123e4567-e89b-12d3-a456-426614174002',
                bidding_strategy: 'CPC',
                bid_amount: 0.5,
                daily_budget: 100.0,
                owner_id: '123e4567-e89b-12d3-a456-426614174003',
                created_at: '2024-05-20T10:00:00.000Z',
                campaign: {
                  id: '123e4567-e89b-12d3-a456-426614174001',
                  name: 'Summer Campaign',
                },
                creative: {
                  id: '123e4567-e89b-12d3-a456-426614174002',
                  name: 'Banner Image',
                },
              },
            ],
            meta: {
              totalItems: 75,
              itemCount: 10,
              itemsPerPage: 10,
              totalPages: 8,
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
