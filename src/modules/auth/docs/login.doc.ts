import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LoginDto } from '../dto/login.dto';

export function ApiLogin() {
  return applyDecorators(
    ApiOperation({
      summary: 'Login to existing account',
      description:
        'Authenticates user with email and password within a specific tenant context.',
    }),
    ApiBody({ type: LoginDto }),
    ApiResponse({
      status: 200,
      description: 'Login successful',
      schema: {
        example: {
          statusCode: 200,
          message: 'Login successful',
          data: {
            access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
            user: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              email: 'john.doe@acme.com',
              full_name: 'John Doe',
              company_name: 'Acme Corporation',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid credentials',
    }),
    ApiResponse({
      status: 404,
      description: 'Not found - Tenant does not exist',
    }),
  );
}
