import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ExchangeTokenDto } from '../dto/exchange-token.dto';

export function ApiExchangeToken() {
  return applyDecorators(
    ApiOperation({
      summary: 'Exchange custom token for Firebase ID token',
      description:
        'Exchanges a custom Firebase token for an ID token that can be used for authentication.',
    }),
    ApiBody({ type: ExchangeTokenDto }),
    ApiResponse({
      status: 200,
      description: 'Token exchanged successfully',
      schema: {
        example: {
          statusCode: 200,
          message: 'Token exchanged successfully',
          data: {
            idToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1...',
            refreshToken: 'AEu4IL3F5xKjN...',
            expiresIn: '3600',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid token',
    }),
  );
}
