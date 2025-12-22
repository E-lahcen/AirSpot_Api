import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiGetCampaigns() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all campaigns with pagination and filters',
      description:
        'Retrieves a paginated list of campaigns with optional filtering by name, goal, status, budget type, and owner.',
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
      description: 'Filter by campaign name (partial match)',
      example: 'Summer',
    }),
    ApiQuery({
      name: 'goal',
      required: false,
      enum: [
        'AWARENESS',
        'CONVERSIONS',
        'TRAFFIC',
        'RETARGET',
        'APP',
        'AUTOMATIC',
        'LEADS',
        'SALES',
        'APP_REVENUE',
      ],
      description: 'Filter by campaign goal',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: [
        'DRAFT',
        'PENDING_VERIFICATION',
        'VERIFIED',
        'ACTIVE',
        'PAUSED',
        'COMPLETED',
        'REJECTED',
      ],
      description: 'Filter by campaign status',
    }),
    ApiQuery({
      name: 'budget_type',
      required: false,
      enum: ['LIFETIME', 'DAILY'],
      description: 'Filter by budget type',
    }),
    ApiQuery({
      name: 'owner_id',
      required: false,
      type: String,
      description: 'Filter by owner user ID',
    }),
    ApiResponse({
      status: 200,
      description: 'Campaigns retrieved successfully',
      schema: {
        example: {
          statusCode: 200,
          message: 'Campaigns retrieved successfully',
          data: {
            items: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Summer Sale 2024',
                goal: 'CONVERSIONS',
                status: 'ACTIVE',
                budget_type: 'LIFETIME',
                budget_amount: 5000.0,
                start_date: '2024-06-01T00:00:00.000Z',
                end_date: '2024-08-31T23:59:59.000Z',
                owner_id: '123e4567-e89b-12d3-a456-426614174001',
                created_at: '2024-05-20T10:00:00.000Z',
              },
            ],
            meta: {
              totalItems: 100,
              itemCount: 10,
              itemsPerPage: 10,
              totalPages: 10,
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
