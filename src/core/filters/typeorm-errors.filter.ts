import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { DatabaseException } from '../exceptions/custom.exceptions';

type DatabaseError = {
  code?: string;
  message?: string;
  detail?: string;
  constraint?: string;
};

@Catch(QueryFailedError)
export class TypeOrmErrorsFilter implements ExceptionFilter {
  private readonly logger: Logger = new Logger('TypeOrmErrorsFilter');

  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const databaseException = this.convertToDatabaseException(exception);
    const errorResponse = databaseException.getResponse();

    this.logger.error(
      `${request.method} ${request.url} - Database Error: ${exception.message}`,
      exception.stack,
    );

    response.status(databaseException.getStatus()).json({
      ...(errorResponse as object),
      timestamp: new Date().toISOString(),
      path: request.url,
      success: false,
    });
  }

  private convertToDatabaseException(
    exception: QueryFailedError,
  ): DatabaseException {
    const driverError: DatabaseError = exception.driverError;
    const errorCode = driverError?.code || 'UNKNOWN_DB_ERROR';

    // Handle specific PostgreSQL error codes
    switch (errorCode) {
      case '23505': // Unique constraint violation
        return DatabaseException.constraintViolation(
          'Unique',
          driverError.detail ||
            'A record with this information already exists.',
        );

      case '23503': // Foreign key constraint violation
        return DatabaseException.constraintViolation(
          'Foreign key',
          driverError.detail || 'Referenced record does not exist.',
        );

      case '23502': // Not null constraint violation
        return DatabaseException.validationError('required field');

      case '22001': // String data too long
        return DatabaseException.validationError('data length');

      case '08001': // Connection error
      case '08006': // Connection failure
        return DatabaseException.connectionError();

      default:
        // Generic database error
        return new DatabaseException('Database operation failed', [
          {
            code: 'DATABASE_QUERY_FAILED',
            message: exception.message || 'Database operation failed.',
          },
          {
            code: 'ERROR_DETAILS',
            message:
              driverError?.detail ||
              driverError?.message ||
              'Unknown database error occurred.',
          },
        ]);
    }
  }
}
