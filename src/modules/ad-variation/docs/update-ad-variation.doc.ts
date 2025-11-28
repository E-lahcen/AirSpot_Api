import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { UpdateAdVariationDto } from '../dto';

export function ApiUpdateAdVariation() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update an ad variation',
      description:
        'Updates an existing ad variation with new information. All fields are optional.',
    }),
    ApiSecurity('x-tenant-slug'),
    ApiParam({
      name: 'id',
      type: String,
      description: 'Ad Variation UUID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({ type: UpdateAdVariationDto }),
    ApiResponse({
      status: 200,
      description: 'Ad variation updated successfully',
      schema: {
        example: {
          statusCode: 200,
          message: 'Ad variation updated successfully',
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Mobile Banner - Variant A (Updated)',
            campaign_id: '123e4567-e89b-12d3-a456-426614174001',
            creative_id: '123e4567-e89b-12d3-a456-426614174002',
            bidding_strategy: 'CPC',
            bid_amount: 0.75,
            daily_budget: 150.0,
            owner_id: '123e4567-e89b-12d3-a456-426614174003',
            organization_id: '123e4567-e89b-12d3-a456-426614174004',
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
      description: 'Not Found - Ad variation does not exist',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
  );
}
