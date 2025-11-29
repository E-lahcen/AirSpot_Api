import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ModuleRef, ContextIdFactory } from '@nestjs/core';
import { TenantConnectionService } from '../services/tenant-connection.service';

/**
 * Interceptor to ensure database connections are properly released after each request
 * This prevents connection leaks that can cause database hangs
 */
@Injectable()
export class TenantConnectionCleanupInterceptor implements NestInterceptor {
  constructor(private moduleRef: ModuleRef) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      finalize(async () => {
        try {
          const request = context.switchToHttp().getRequest();
          if (request) {
            // Resolve the request-scoped service for the current context
            const contextId = ContextIdFactory.getByRequest(request);
            const tenantConnectionService = await this.moduleRef.resolve(
              TenantConnectionService,
              contextId,
              { strict: false },
            );

            if (tenantConnectionService) {
              await tenantConnectionService.cleanup();
            }
          }
        } catch (error) {
          // Silently fail if service cannot be resolved (e.g. non-HTTP context)
        }
      }),
    );
  }
}
