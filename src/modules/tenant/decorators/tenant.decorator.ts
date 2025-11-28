import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantService } from '../services/tenant.service';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ tenantService: TenantService }>();
    const tenantService = request.tenantService;
    return tenantService?.getSlug() || null;
  },
);

export const CurrentSchema = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ tenantService: TenantService }>();
    const tenantService = request.tenantService;
    return tenantService?.getSchema() || 'public';
  },
);
