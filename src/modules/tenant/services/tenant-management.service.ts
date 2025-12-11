import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import {
  TENANT_MIGRATIONS,
  TenantMigrationHelpers,
} from '@app/migrations/tenant-schema-migrations';
import { UserTenant } from '@app/modules/user-tenant/entities/user-tenant.entity';

export interface CreateTenantData {
  companyName: string;
  ownerEmail: string;
  firebaseTenantId: string;
  ownerId?: string;
  slug?: string;
  description?: string;
  logo?: string;
  region?: string;
  defaultRole?: string;
  enforceDomain?: boolean;
  domain?: string;
}

interface TenantMemberCount {
  tenant_id: string;
  count: string;
}

interface TenantRoleResult {
  role_name: string;
}

@Injectable()
export class TenantManagementService {
  private readonly logger = new Logger(TenantManagementService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(UserTenant)
    private readonly userTenantRepository: Repository<UserTenant>,
  ) {}

  async setTenantOwner(tenantId: string, ownerId: string): Promise<void> {
    return this.tenantRepository
      .update({ id: tenantId }, { owner_id: ownerId })
      .then(() => {
        this.logger.log(`Set owner for tenant ${tenantId} to user ${ownerId}`);
      });
  }

  /**
   * Creates a new tenant record and schema
   */
  async createTenant(data: CreateTenantData): Promise<Tenant> {
    // Generate slug from company name (human-readable, URL-friendly)
    const slug = await this.resolveSlug(data);

    // Generate schema name (sanitized for PostgreSQL - no hyphens)
    const schemaName = `tenant_${slug.replace(/-/g, '_')}`;

    this.logger.log(`Creating tenant: (${slug}) for ${data.companyName}`);

    // Check if tenant already exists
    const existingTenant = await this.tenantRepository.findOne({
      where: { slug },
    });

    if (existingTenant) {
      if (data.slug) {
        throw new ConflictException({
          message: 'Slug already exists',
          errors: [
            {
              code: 'TENANT_SLUG_EXISTS',
              message: `Slug ${slug} is already in use`,
            },
          ],
        });
      }
      this.logger.warn(`Tenant ${slug} already exists`);
      return existingTenant;
    }

    // Create tenant record in main database
    const tenant = this.tenantRepository.create({
      slug: slug,
      company_name: data.companyName,
      schema_name: schemaName,
      owner_email: data.ownerEmail,
      firebase_tenant_id: data.firebaseTenantId,
      owner_id: data.ownerId || null,
      is_active: true,
      description: data.description || null,
      logo: data.logo || null,
      region: data.region || null,
      role: data.defaultRole || null,
      enforce_domain: data.enforceDomain ?? false,
      domain:
        data.enforceDomain && data.domain ? data.domain.toLowerCase() : null,
    });

    const savedTenant = await this.tenantRepository.save(tenant);

    // Create the actual schema
    try {
      // Ensure uuid-ossp extension is available (needed for UUID generation)
      try {
        await this.dataSource.query(
          `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
        );
        this.logger.log(`✓ uuid-ossp extension ensured`);
      } catch (extError) {
        this.logger.warn(
          `uuid-ossp extension might already exist or lacks permissions: ${extError}`,
        );
      }

      // Try using the onboard_tenant function first
      try {
        await this.dataSource.query(`SELECT onboard_tenant($1)`, [slug]);
        this.logger.log(
          `✓ Tenant schema created using onboard_tenant: ${schemaName}`,
        );
      } catch {
        // If function doesn't exist, create schema directly
        this.logger.warn(
          `onboard_tenant function not found, creating schema directly`,
        );
        await this.dataSource.query(
          `CREATE SCHEMA IF NOT EXISTS ${schemaName}`,
        );
        await this.dataSource.query(
          `GRANT ALL ON SCHEMA ${schemaName} TO CURRENT_USER`,
        );
        this.logger.log(`✓ Tenant schema created directly: ${schemaName}`);
      }

      // Create the users table in the new tenant schema
      await this.createTenantTables(slug);
    } catch (error) {
      this.logger.error(`Failed to create tenant schema: ${slug}`, error);
      // Rollback tenant record if schema creation fails
      await this.tenantRepository.remove(savedTenant);
      throw error;
    }

    return savedTenant;
  }

  async findByCompanyName(companyName: string): Promise<Tenant | null> {
    const tenant = await this.tenantRepository.findOne({
      where: { company_name: companyName },
    });
    if (tenant) {
      await this.attachMemberCounts([tenant]);
    }
    return tenant;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const tenant = await this.tenantRepository.findOne({ where: { slug } });
    if (tenant) {
      await this.attachMemberCounts([tenant]);
    }
    return tenant;
  }

  async findByOwnerEmail(ownerEmail: string): Promise<Tenant | null> {
    const tenant = await this.tenantRepository.findOne({
      where: { owner_email: ownerEmail },
    });
    if (tenant) {
      await this.attachMemberCounts([tenant]);
    }
    return tenant;
  }

  async getAllTenants(): Promise<Tenant[]> {
    const tenants = await this.tenantRepository.find({
      order: { created_at: 'DESC' },
    });
    await this.attachMemberCounts(tenants);
    return tenants;
  }

  async getTenantsByOwner(userId: string): Promise<Tenant[]> {
    // 1. Get tenants where user is owner
    const ownedTenants = await this.tenantRepository.find({
      where: { owner_id: userId },
      order: { created_at: 'DESC' },
    });

    // 2. Get tenants where user is member
    const userTenants = await this.userTenantRepository.find({
      where: { user_id: userId },
      relations: ['tenant'],
    });

    const memberTenants = userTenants
      .map((ut) => ut.tenant)
      .filter((t) => t && t.is_active);

    // 3. Combine and deduplicate
    const allTenantsMap = new Map<string, Tenant>();
    ownedTenants.forEach((t) => allTenantsMap.set(t.id, t));
    memberTenants.forEach((t) => allTenantsMap.set(t.id, t));

    const allTenants = Array.from(allTenantsMap.values());

    // 4. Set roles
    for (const tenant of allTenants) {
      if (tenant.owner_id === userId) {
        tenant.role = 'owner';
      } else {
        tenant.role = await this.getUserRoleInTenant(
          tenant.schema_name,
          userId,
        );
      }
    }

    await this.attachMemberCounts(allTenants);
    return allTenants;
  }

  private async getUserRoleInTenant(
    schemaName: string,
    userId: string,
  ): Promise<string> {
    try {
      const result: TenantRoleResult[] = await this.dataSource.query(
        `SELECT r.name as role_name 
         FROM "${schemaName}".users u
         JOIN "${schemaName}".user_roles ur ON u.id = ur.user_id
         JOIN "${schemaName}".roles r ON ur.role_id = r.id
         WHERE u.id = $1`,
        [userId],
      );

      if (result && result.length > 0) {
        const roles = result.map((r) => r.role_name);
        if (roles.includes('owner')) return 'owner';
        if (roles.includes('admin')) return 'admin';
        return 'member';
      }
      return 'member';
    } catch (error) {
      this.logger.warn(
        `Failed to fetch role for user ${userId} in schema ${schemaName}: ${error}`,
      );
      return 'member';
    }
  }

  async deactivateTenant(slug: string): Promise<void> {
    await this.tenantRepository.update({ slug }, { is_active: false });
    this.logger.log(`Tenant deactivated: ${slug}`);
  }

  async updateTenantStatus(
    id: string,
    status: 'pending' | 'approved' | 'rejected',
  ): Promise<Tenant> {
    await this.tenantRepository.update(id, { status });
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    this.logger.log(`Tenant ${id} status updated to ${status}`);
    return tenant;
  }

  /**
   * Creates tables in the tenant schema using migrations
   */
  private async createTenantTables(slug: string): Promise<void> {
    // Sanitize slug for schema name (replace hyphens with underscores)
    const schema = `tenant_${slug.replace(/-/g, '_')}`;

    this.logger.log(`Creating tables in schema: ${schema}`);

    // Get a query runner from the main data source
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();

      // Get list of already applied migrations (handles case where tables already exist)
      const appliedVersions = await TenantMigrationHelpers.getAppliedMigrations(
        queryRunner,
        schema,
      );

      // Filter migrations that need to be applied
      const pendingMigrations = TENANT_MIGRATIONS.filter(
        (migration) => !appliedVersions.includes(migration.version),
      );

      if (pendingMigrations.length === 0) {
        this.logger.log(`All migrations already applied for schema: ${schema}`);
        return;
      }

      // Run all pending tenant schema migrations in order
      for (const migration of pendingMigrations) {
        this.logger.log(
          `Applying migration ${migration.version} - ${migration.name}`,
        );
        await migration.up(queryRunner, schema);
        await TenantMigrationHelpers.recordMigration(
          queryRunner,
          schema,
          migration,
        );
      }

      this.logger.log(`✓ Tables created in schema: ${schema}`);
    } catch (error) {
      this.logger.error(`Failed to create tables in schema: ${schema}`, error);
      throw error;
    } finally {
      // Always release the query runner
      await queryRunner.release();
    }
  }

  /**
   * Generates a tenant ID from company name
   */
  private generateTenantId(companyName: string): string {
    // Convert to lowercase, remove special chars, replace spaces with underscores
    const sanitized = companyName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50); // Limit length

    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString(36);

    return `${sanitized}_${timestamp}`;
  }

  /**
   * Generates a URL-friendly slug from company name
   */
  private generateSlug(companyName: string): string {
    return companyName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Generates a unique slug, adding number suffix if needed
   */
  private async generateUniqueSlug(companyName: string): Promise<string> {
    const baseSlug = this.generateSlug(companyName);
    let slug = baseSlug;
    let counter = 1;

    // Check if slug exists and increment until unique
    while (await this.slugExists(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Checks if a slug already exists
   */
  private async slugExists(slug: string): Promise<boolean> {
    const tenant = await this.tenantRepository.findOne({ where: { slug } });
    return tenant !== null;
  }

  private async resolveSlug(data: CreateTenantData): Promise<string> {
    if (data.slug) {
      const sanitized = this.generateSlug(data.slug);
      if (!sanitized) {
        throw new ConflictException({
          message: 'Invalid slug',
          errors: [
            {
              code: 'INVALID_SLUG',
              message:
                'Provided slug is invalid. Use only letters, numbers, and hyphens.',
            },
          ],
        });
      }

      if (await this.slugExists(sanitized)) {
        throw new ConflictException({
          message: 'Slug already exists',
          errors: [
            {
              code: 'TENANT_SLUG_EXISTS',
              message: `Slug ${sanitized} is already in use`,
            },
          ],
        });
      }

      return sanitized;
    }

    return this.generateUniqueSlug(data.companyName);
  }

  /**
   * Checks if a tenant exists by verifying both the tenant record and schema
   */
  async tenantExists(slug: string): Promise<boolean> {
    const tenant = await this.tenantRepository.findOne({
      where: { slug },
    });
    return tenant !== null && tenant.is_active;
  }

  private async attachMemberCounts(tenants: Tenant[]): Promise<void> {
    if (tenants.length === 0) return;

    const tenantIds = tenants.map((t) => t.id);

    const memberCounts = await this.dataSource
      .getRepository(UserTenant)
      .createQueryBuilder('user_tenant')
      .select('user_tenant.tenant_id', 'tenant_id')
      .addSelect('COUNT(user_tenant.id)', 'count')
      .where('user_tenant.tenant_id IN (:...tenantIds)', { tenantIds })
      .andWhere('user_tenant.deleted_at IS NULL')
      .groupBy('user_tenant.tenant_id')
      .getRawMany<TenantMemberCount>();

    const countMap = new Map<string, number>();
    memberCounts.forEach((item) => {
      countMap.set(item.tenant_id, parseInt(item.count, 10));
    });

    tenants.forEach((tenant) => {
      tenant.members = countMap.get(tenant.id) || 0;
    });
  }
}
