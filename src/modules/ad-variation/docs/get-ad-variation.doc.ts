import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiGetAdVariation() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get an ad variation by ID',
      description:
        'Retrieves detailed information about a specific ad variation including its campaign, creative, and audience targets.',
    }),
    ApiSecurity('x-tenant-slug'),
    ApiParam({
      name: 'id',
      type: String,
      description: 'Ad Variation UUID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Ad variation retrieved successfully',
      schema: {
        example: {
          statusCode: 200,
          message: 'Ad variation retrieved successfully',
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Mobile Banner - Variant A',
            campaign_id: '123e4567-e89b-12d3-a456-426614174001',
            creative_id: '123e4567-e89b-12d3-a456-426614174002',
            bidding_strategy: 'CPC',
            bid_amount: 0.5,
            daily_budget: 100.0,
            owner_id: '123e4567-e89b-12d3-a456-426614174003',
            organization_id: '123e4567-e89b-12d3-a456-426614174004',
            created_at: '2024-05-20T10:00:00.000Z',
            updated_at: '2024-05-20T10:00:00.000Z',
            campaign: {
              id: '123e4567-e89b-12d3-a456-426614174001',
              name: 'Summer Campaign',
            },
            creative: {
              id: '123e4567-e89b-12d3-a456-426614174002',
              name: 'Banner Image',
            },
            audiences: [],
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found - Ad variation does not exist',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
  );
}
