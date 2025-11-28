import { HttpException } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common/enums/http-status.enum';

export type ErrorCodes =
  | `DATABASE_${'CONNECTION_FAILED' | 'QUERY_FAILED' | 'CONSTRAINT_VIOLATION'}`
  | 'TRY_AGAIN_LATER'
  | 'ERROR_DETAILS'
  | 'VALIDATION_FAILED'
  | 'CHECK_CREDENTIALS';

export type ErrorResponse<T extends ErrorCodes = ErrorCodes> = {
  code: T;
  message: string;
};

export class DatabaseException extends HttpException {
  constructor(
    message: string,
    errors: ErrorResponse[] = [],
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        statusCode,
        message,
        errors:
          errors.length > 0
            ? errors
            : [{ code: 'DATABASE_QUERY_FAILED', message }],
      },
      statusCode,
    );
  }

  static constraintViolation(
    constraintType: string,
    details?: string,
  ): DatabaseException {
    const message = 'Database constraint violation';
    const errors: ErrorResponse[] = [
      {
        code: 'DATABASE_CONSTRAINT_VIOLATION',
        message: `${constraintType} constraint violation occurred.`,
      },
    ];

    if (details) {
      errors.push({
        code: 'ERROR_DETAILS',
        message: details,
      });
    }

    return new DatabaseException(message, errors, HttpStatus.CONFLICT);
  }

  static connectionError(): DatabaseException {
    return new DatabaseException(
      'Database service unavailable',
      [
        {
          code: 'DATABASE_CONNECTION_FAILED',
          message: 'Unable to connect to the database.',
        },
        {
          code: 'TRY_AGAIN_LATER',
          message: 'Please try again in a few moments.',
        },
      ],
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  static validationError(fieldName?: string): DatabaseException {
    const message = fieldName
      ? `Invalid value for field: ${fieldName}`
      : 'Database validation failed';

    return new DatabaseException(
      message,
      [
        {
          code: 'VALIDATION_FAILED',
          message: fieldName
            ? `The value provided for '${fieldName}' is invalid.`
            : 'One or more fields contain invalid values.',
        },
        {
          code: 'CHECK_CREDENTIALS',
          message: 'Please verify your input and try again.',
        },
      ],
      HttpStatus.BAD_REQUEST,
    );
  }
}
