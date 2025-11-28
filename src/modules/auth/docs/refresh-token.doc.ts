import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

export function ApiRefreshToken() {
  return applyDecorators(
    ApiOperation({
      summary: 'Refresh Firebase ID token',
      description:
        'Refreshes an expired ID token using a valid refresh token. Returns a new ID token and optionally a new refresh token.',
    }),
    ApiBody({ type: RefreshTokenDto }),
    ApiResponse({
      status: 200,
      description: 'Token refreshed successfully',
      schema: {
        example: {
          statusCode: 200,
          message: 'Token refreshed successfully',
          data: {
            id_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1...',
            refresh_token: 'AEu4IL3F5xKjN...',
            expires_in: '3600',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid or expired refresh token',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid refresh token',
    }),
  );
}
