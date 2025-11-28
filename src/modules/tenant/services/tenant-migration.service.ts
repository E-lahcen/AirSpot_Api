/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
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

      // Filter migrations that need to be applied
      const pendingMigrations = TENANT_MIGRATIONS.filter(
        (migration) => !appliedVersions.includes(migration.version),
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

      // Always run "Ensure" type migrations (idempotent safety checks)
      // These migrations check if tables exist and create them if missing
      const ensureMigrations = TENANT_MIGRATIONS.filter((migration) =>
        migration.name.startsWith('Ensure'),
      );

      for (const migration of ensureMigrations) {
        this.logger.log(
          `Running ensure migration ${migration.version} - ${migration.name} for ${schema}`,
        );
        try {
          await migration.up(queryRunner, schema);
          // Only record if not already recorded
          if (!appliedVersions.includes(migration.version)) {
            await TenantMigrationHelpers.recordMigration(
              queryRunner,
              schema,
              migration,
            );
          }
          this.logger.log(
            `✓ Ensure migration ${migration.version} - ${migration.name} completed`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to run ensure migration ${migration.version} - ${migration.name}`,
            error,
          );
          // Don't throw - ensure migrations are safety checks
        }
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

      // Run all migrations to create tables
      for (const migration of TENANT_MIGRATIONS) {
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

  /**
   * Ensure storyboards table exists for a specific tenant
   * This is a safety check that runs regardless of migration status
   */
  async ensureStoryboardsTable(slug: string): Promise<void> {
    const schema = `tenant_${slug.replace(/-/g, '_')}`;
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();

      // Check if schema exists
      const schemaExists = await this.checkSchemaExists(queryRunner, schema);
      if (!schemaExists) {
        this.logger.warn(
          `Schema ${schema} does not exist, skipping storyboards table check`,
        );
        return;
      }

      // Check if storyboards table exists
      const tableExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = '${schema}'
          AND table_name = 'storyboards'
        )
      `);

      if (!tableExists[0]?.exists) {
        this.logger.log(`Creating storyboards table for schema: ${schema}`);

        // Create storyboards table
        await queryRunner.query(`
          CREATE TABLE "${schema}".storyboards (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP,
            "organization_id" uuid NOT NULL,
            "title" character varying(255) NOT NULL,
            "duration" character varying(50) NOT NULL,
            "scenes" text NOT NULL,
            "scenes_data" jsonb NOT NULL DEFAULT '[]',
            "video_url" character varying(500) NOT NULL,
            "owner_id" uuid NOT NULL,
            CONSTRAINT "PK_${schema}_storyboards" PRIMARY KEY ("id")
          )
        `);

        // Add foreign key constraint
        await queryRunner.query(`
          ALTER TABLE "${schema}".storyboards
          ADD CONSTRAINT "FK_${schema}_storyboards_owner"
          FOREIGN KEY ("owner_id") REFERENCES "${schema}".users("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        this.logger.log(`✓ Storyboards table created for schema: ${schema}`);
      } else {
        // Table exists, ensure foreign key constraint exists
        const fkExists = await queryRunner.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.table_constraints
            WHERE table_schema = '${schema}'
            AND table_name = 'storyboards'
            AND constraint_name = 'FK_${schema}_storyboards_owner'
          )
        `);

        if (!fkExists[0]?.exists) {
          this.logger.log(
            `Adding foreign key constraint for storyboards table in schema: ${schema}`,
          );
          await queryRunner.query(`
            ALTER TABLE "${schema}".storyboards
            ADD CONSTRAINT "FK_${schema}_storyboards_owner"
            FOREIGN KEY ("owner_id") REFERENCES "${schema}".users("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
          `);
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to ensure storyboards table for ${schema}`,
        error,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Ensure storyboards table exists for all tenants
   */
  async ensureStoryboardsTableForAllTenants(): Promise<void> {
    this.logger.log('Ensuring storyboards table exists for all tenants...');

    const tenants = await this.tenantRepository.find({
      where: { is_active: true },
    });

    for (const tenant of tenants) {
      try {
        await this.ensureStoryboardsTable(tenant.slug);
      } catch (error) {
        this.logger.error(
          `Failed to ensure storyboards table for tenant ${tenant.slug}`,
          (error as Error).message,
        );
      }
    }
  }
}
