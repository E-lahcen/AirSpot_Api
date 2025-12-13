import { Injectable, Scope } from '@nestjs/common';
import { DEFAULT_SCHEMA } from '../constants/tenant.constants';
import { Tenant } from '../entities/tenant.entity';

@Injectable({ scope: Scope.REQUEST })
export class TenantService {
  private slug: string | null = null;
  private schema: string = DEFAULT_SCHEMA;
  private firebaseTenantId: string | null = null;
  private tenantId: string | null = null;

  private tenant: Tenant | null = null;

  setTenant(tenant: Tenant): void {
    this.tenant = tenant;
    this.slug = tenant.slug;
    this.firebaseTenantId = tenant.firebase_tenant_id || null;
    this.tenantId = tenant.id || null;
    // Convert slug to schema name (replace hyphens with underscores for PostgreSQL)
    this.schema = `tenant_${tenant.slug.replace(/-/g, '_')}`;
  }

  getTenant(): Tenant | null {
    return this.tenant;
  }

  getSlug(): string | null {
    return this.slug;
  }

  getFirebaseTenantId(): string | null {
    return this.firebaseTenantId;
  }

  getSchema(): string {
    return this.schema;
  }

  hasTenant(): boolean {
    return this.slug !== null;
  }

  reset(): void {
    this.slug = null;
    this.schema = DEFAULT_SCHEMA;
    this.firebaseTenantId = null;
  }
}
