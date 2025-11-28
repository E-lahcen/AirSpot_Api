import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { CreateAudienceDto } from '../dto';

export function ApiCreateAudience() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new audience target',
      description:
        'Creates a new audience targeting rule for an ad variation, specifying the type of targeting and target details.',
    }),
    ApiSecurity('x-tenant-slug'),
    ApiBody({ type: CreateAudienceDto }),
    ApiResponse({
      status: 201,
      description: 'Audience target created successfully',
      schema: {
        example: {
          statusCode: 201,
          message: 'Audience target created successfully',
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            variation_id: '123e4567-e89b-12d3-a456-426614174001',
            type: 'LOCATION',
            target_id: 'US-CA',
            owner_id: '123e4567-e89b-12d3-a456-426614174002',
            organization_id: '123e4567-e89b-12d3-a456-426614174003',
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
