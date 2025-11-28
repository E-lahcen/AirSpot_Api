import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../services/tenant.service';
import { TenantManagementService } from '../services/tenant-management.service';
import { TENANT_HEADER } from '../constants/tenant.constants';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantService: TenantService,
    private readonly tenantManagementService: TenantManagementService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip tenant check for public template and video files
    const path = req.path || req.url;
    if (
      path.includes('/templates/public/') ||
      path.includes('/video-download/public/')
    ) {
      return next();
    }

    // Extract tenant slug from header
    const slug = req.headers[TENANT_HEADER] as string;

    // Alternative: Extract from subdomain
    // const host = req.headers.host || '';
    // const subdomain = host.split('.')[0];
    // const slug = subdomain !== 'api' ? subdomain : null;

    if (!slug) {
      throw new BadRequestException({
        message: 'Tenant identification required',
        errors: [
          {
            code: 'MISSING_TENANT_SLUG',
            message: `Missing required header: ${TENANT_HEADER}`,
          },
        ],
      });
    }

    // Fetch tenant to get Firebase tenant ID
    const tenant = await this.tenantManagementService.findBySlug(slug);
    if (!tenant) {
      throw new NotFoundException({
        message: 'Tenant not found',
        errors: [
          {
            code: 'TENANT_NOT_FOUND',
            message: `No tenant found with slug: ${slug}`,
          },
        ],
      });
    }

    // Set tenant context for this request with Firebase tenant ID
    this.tenantService.setTenant(tenant);

    next();
  }
}
