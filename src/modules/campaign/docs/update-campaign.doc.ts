import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { UpdateCampaignDto } from '../dto/update-campaign.dto';

export function ApiUpdateCampaign() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a campaign',
      description:
        'Updates an existing campaign with new information. All fields are optional.',
    }),
    ApiSecurity('x-tenant-slug'),
    ApiParam({
      name: 'id',
      type: String,
      description: 'Campaign UUID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({ type: UpdateCampaignDto }),
    ApiResponse({
      status: 200,
      description: 'Campaign updated successfully',
      schema: {
        example: {
          statusCode: 200,
          message: 'Campaign updated successfully',
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Summer Sale 2024 - Extended',
            goal: 'CONVERSIONS',
            status: 'ACTIVE',
            budget_type: 'LIFETIME',
            budget_amount: 7500.0,
            start_date: '2024-06-01T00:00:00.000Z',
            end_date: '2024-09-30T23:59:59.000Z',
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
      description: 'Not Found - Campaign does not exist',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
  );
}
