import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { TenantConnectionService } from '../services/tenant-connection.service';

/**
 * Interceptor to ensure database connections are properly released after each request
 * This prevents connection leaks that can cause database hangs
 */
@Injectable()
export class TenantConnectionCleanupInterceptor implements NestInterceptor {
  constructor(
    private readonly tenantConnectionService: TenantConnectionService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      finalize(async () => {
        // Always cleanup connections, even if request fails
        await this.tenantConnectionService.cleanup();
      }),
    );
  }
}
