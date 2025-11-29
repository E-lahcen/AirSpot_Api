/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import {
  TENANT_MIGRATIONS,
  TenantMigrationHelpers,
} from '@app/migrations/tenant-schema-migrations';

/**
 * Service to handle migrations for tenant schemas
 * This ensures all tenant schemas stay in sync with entity changes
 */
@Injectable()
export class TenantMigrationService {
  private readonly logger = new Logger(TenantMigrationService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * Run migrations on a specific tenant schema
   */
  async runMigrationsForTenant(slug: string): Promise<void> {
    const schema = `tenant_${slug.replace(/-/g, '_')}`;
    this.logger.log(`Running migrations for tenant schema: ${schema}`);

    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();

      // Check if schema exists
      const schemaExists = await this.checkSchemaExists(queryRunner, schema);
      if (!schemaExists) {
        this.logger.warn(`Schema ${schema} does not exist, skipping`);
        return;
      }

      // Get list of already applied migrations
      const appliedVersions = await TenantMigrationHelpers.getAppliedMigrations(
        queryRunner,
        schema,
      );

      // Filter migrations that need to be applied (excluding skipped migrations)
      const pendingMigrations = TENANT_MIGRATIONS.filter(
        (migration) =>
          !migration.skip && !appliedVersions.includes(migration.version),
      );

      if (pendingMigrations.length === 0) {
        this.logger.log(`No pending migrations for schema: ${schema}`);
        return;
      }

      // Apply each pending migration
      for (const migration of pendingMigrations) {
        this.logger.log(
          `Applying migration ${migration.version} - ${migration.name} to ${schema}`,
        );
        await migration.up(queryRunner, schema);
        await TenantMigrationHelpers.recordMigration(
          queryRunner,
          schema,
          migration,
        );
        this.logger.log(
          `✓ Applied migration ${migration.version} - ${migration.name}`,
        );
      }

      this.logger.log(`✓ Migrations completed for schema: ${schema}`);
    } catch (error) {
      this.logger.error(`Failed to run migrations for ${schema}`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Run migrations on all tenant schemas
   * Use this when deploying schema changes
   */
  async runMigrationsForAllTenants(): Promise<{
    success: string[];
    failed: string[];
  }> {
    this.logger.log('Running migrations for all tenant schemas...');

    const tenants = await this.tenantRepository.find({
      where: { is_active: true },
    });

    const results = {
      success: [] as string[],
      failed: [] as string[],
    };

    for (const tenant of tenants) {
      try {
        await this.runMigrationsForTenant(tenant.slug);
        results.success.push(tenant.slug);
      } catch (error) {
        this.logger.error(
          `Failed to migrate tenant ${tenant.slug}`,
          (error as Error).message,
        );
        results.failed.push(tenant.slug);
      }
    }

    this.logger.log(
      `Migration summary - Success: ${results.success.length}, Failed: ${results.failed.length}`,
    );

    return results;
  }

  /**
   * Rebuild a tenant schema (drop and recreate)
   * WARNING: This will delete all data in the tenant schema!
   */
  async rebuildTenantSchema(slug: string): Promise<void> {
    const schema = `tenant_${slug.replace(/-/g, '_')}`;
    this.logger.warn(
      `⚠️  REBUILDING schema: ${schema} - ALL DATA WILL BE LOST!`,
    );

    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();

      // Check if schema exists
      const schemaExists = await this.checkSchemaExists(queryRunner, schema);

      if (schemaExists) {
        // Drop the schema and all its contents
        await queryRunner.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
        this.logger.log(`✓ Dropped schema: ${schema}`);
      }

      // Recreate the schema
      await queryRunner.query(`CREATE SCHEMA "${schema}"`);
      this.logger.log(`✓ Created schema: ${schema}`);

      // Run all migrations to create tables (excluding skipped migrations)
      for (const migration of TENANT_MIGRATIONS.filter((m) => !m.skip)) {
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
      this.logger.error(`Failed to rebuild schema ${schema}`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Rebuild all tenant schemas
   * WARNING: This will delete all data in all tenant schemas!
   */
  async rebuildAllTenantSchemas(): Promise<void> {
    this.logger.warn(
      '⚠️  REBUILDING ALL TENANT SCHEMAS - ALL TENANT DATA WILL BE LOST!',
    );

    const tenants = await this.tenantRepository.find();

    for (const tenant of tenants) {
      await this.rebuildTenantSchema(tenant.slug);
    }

    this.logger.log('✓ All tenant schemas rebuilt');
  }

  /**
   * Check if a schema exists
   */
  private async checkSchemaExists(
    queryRunner: any,
    schema: string,
  ): Promise<boolean> {
    const result = (await queryRunner.query(
      `SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = $1)`,
      [schema],
    )) as Array<{ exists: boolean }>;
    return result[0].exists;
  }

  /**
   * Check if tables exist in a schema
   */
  private async checkTablesExist(
    queryRunner: any,
    schema: string,
  ): Promise<boolean> {
    const result = (await queryRunner.query(
      `
      SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = $1 AND table_name = 'users'
      )
    `,
      [schema],
    )) as Array<{ exists: boolean }>;
    return result[0].exists;
  }

  /**
   * Get applied migration versions for a tenant schema
   */
  async getAppliedMigrations(slug: string): Promise<number[]> {
    const schema = `tenant_${slug.replace(/-/g, '_')}`;
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      return await TenantMigrationHelpers.getAppliedMigrations(
        queryRunner,
        schema,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get migration status for all tenants
   */
  async getMigrationStatus(): Promise<
    Array<{
      slug: string;
      schemaName: string;
      schemaExists: boolean;
      tablesExist: boolean;
      isActive: boolean;
    }>
  > {
    const tenants = await this.tenantRepository.find();
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();

      const status = await Promise.all(
        tenants.map(async (tenant) => {
          const schema = `tenant_${tenant.slug.replace(/-/g, '_')}`;
          const schemaExists = await this.checkSchemaExists(
            queryRunner,
            schema,
          );
          const tablesExist = schemaExists
            ? await this.checkTablesExist(queryRunner, schema)
            : false;

          return {
            slug: tenant.slug,
            schemaName: schema,
            schemaExists,
            tablesExist,
            isActive: tenant.is_active,
          };
        }),
      );

      return status;
    } finally {
      await queryRunner.release();
    }
  }
}
