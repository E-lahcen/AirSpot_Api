import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { UpdateAudienceDto } from '../dto';

export function ApiUpdateAudience() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update an audience target',
      description:
        'Updates an existing audience targeting rule with new information. All fields are optional.',
    }),
    ApiSecurity('x-tenant-slug'),
    ApiParam({
      name: 'id',
      type: String,
      description: 'Audience Target UUID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({ type: UpdateAudienceDto }),
    ApiResponse({
      status: 200,
      description: 'Audience target updated successfully',
      schema: {
        example: {
          statusCode: 200,
          message: 'Audience target updated successfully',
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            variation_id: '123e4567-e89b-12d3-a456-426614174001',
            type: 'INTEREST',
            target_id: 'TECH-001',
            owner_id: '123e4567-e89b-12d3-a456-426614174002',
            organization_id: '123e4567-e89b-12d3-a456-426614174003',
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
      description: 'Not Found - Audience target does not exist',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
  );
}
