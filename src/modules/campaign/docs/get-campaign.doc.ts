import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiGetCampaign() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a campaign by ID',
      description:
        'Retrieves detailed information about a specific campaign by its unique identifier.',
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
      description: 'Campaign retrieved successfully',
      schema: {
        example: {
          statusCode: 200,
          message: 'Campaign retrieved successfully',
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Summer Sale 2024',
            goal: 'CONVERSIONS',
            status: 'ACTIVE',
            budget_type: 'LIFETIME',
            budget_amount: 5000.0,
            start_date: '2024-06-01T00:00:00.000Z',
            end_date: '2024-08-31T23:59:59.000Z',
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
      description: 'Not Found - Campaign does not exist',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
  );
}
