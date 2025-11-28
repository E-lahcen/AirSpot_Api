import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { CreateCampaignDto } from '../dto/create-campaign.dto';

export function ApiCreateCampaign() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new campaign',
      description:
        'Creates a new advertising campaign with specified budget, goals, and scheduling.',
    }),
    ApiSecurity('x-tenant-slug'),
    ApiBody({ type: CreateCampaignDto }),
    ApiResponse({
      status: 201,
      description: 'Campaign created successfully',
      schema: {
        example: {
          statusCode: 201,
          message: 'Campaign created successfully',
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Summer Sale 2024',
            goal: 'CONVERSIONS',
            status: 'DRAFT',
            budget_type: 'LIFETIME',
            budget_amount: 5000.0,
            start_date: '2024-06-01T00:00:00.000Z',
            end_date: '2024-08-31T23:59:59.000Z',
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
