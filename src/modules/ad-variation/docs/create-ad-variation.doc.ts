import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { CreateAdVariationDto } from '../dto';

export function ApiCreateAdVariation() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new ad variation',
      description:
        'Creates a new ad variation with specific bidding strategy, budget, and creative for a campaign.',
    }),
    ApiSecurity('x-tenant-slug'),
    ApiBody({ type: CreateAdVariationDto }),
    ApiResponse({
      status: 201,
      description: 'Ad variation created successfully',
      schema: {
        example: {
          statusCode: 201,
          message: 'Ad variation created successfully',
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
