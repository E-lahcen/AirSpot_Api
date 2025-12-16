// src/modules/tenant/tenant-setup.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EnvironmentVariables } from '../../../core/validators';
import { Environment } from '@app/common/enums';

@Injectable()
export class TenantSetupService implements OnModuleInit {
  private readonly logger = new Logger(TenantSetupService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  async onModuleInit() {
    const nodeEnv = this.configService.get<`${Environment}`>('NODE_ENV');
    const autoSetup = this.configService.get<string>(
      'AUTO_SETUP_MULTITENANCY',
      'true',
    );

    // Allow opt-out via environment variable
    if (autoSetup === 'false') {
      this.logger.log('Auto-setup disabled via AUTO_SETUP_MULTITENANCY=false');
      return;
    }

    this.logger.log('Setting up multitenancy functions...');

    try {
      await this.setupMultitenancyFunctions();
      this.logger.log('✓ Multitenancy functions installed successfully');
    } catch (error) {
      this.logger.error('Failed to setup multitenancy functions', error);

      // In production, you might want to fail fast to detect issues early
      if (nodeEnv === 'production') {
        this.logger.error('CRITICAL: Multitenancy setup failed in production');
        throw error; // Optional: prevent app from starting with broken setup
      }
      // In dev, just warn and continue
    }
  }

  private async setupMultitenancyFunctions(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();

      // Ensure UUID extension is available database-wide before any operations
      try {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        this.logger.log('✓ UUID extension verified/created');
      } catch {
        this.logger.warn(
          'UUID extension creation skipped (may already exist or lack permissions)',
        );
      }

      // // Create main tenants table in public schema
      // await queryRunner.query(`
      //   CREATE TABLE IF NOT EXISTS public.tenants (
      //     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      //     tenant_id VARCHAR(100) UNIQUE NOT NULL,
      //     slug VARCHAR(100) UNIQUE NOT NULL,
      //     company_name VARCHAR(255) NOT NULL,
      //     schema_name VARCHAR(100) UNIQUE NOT NULL,
      //     is_active BOOLEAN DEFAULT TRUE,
      //     owner_email VARCHAR(255) NOT NULL,
      //     firebase_tenant_id VARCHAR(128) UNIQUE,
      //     created_at TIMESTAMP DEFAULT NOW(),
      //     updated_at TIMESTAMP DEFAULT NOW()
      //   );
      // `);

      // this.logger.log('✓ Main tenants table created/verified');

      // // Drop old functions if they exist (to allow parameter name changes)
      await queryRunner.query(`
        DROP FUNCTION IF EXISTS create_tenant_schema(character varying);
        DROP FUNCTION IF EXISTS setup_tenant_tables(character varying);
        DROP FUNCTION IF EXISTS onboard_tenant(character varying);
        DROP FUNCTION IF EXISTS delete_tenant_schema(character varying);
      `);

      // // Create tenant schema function
      await queryRunner.query(`
        CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_slug VARCHAR)
        RETURNS VOID AS $$
        DECLARE
          schema_name VARCHAR := 'tenant_' || replace(tenant_slug, '-', '_');
        BEGIN
          EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
          EXECUTE format('GRANT ALL ON SCHEMA %I TO CURRENT_USER', schema_name);
          EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA %I TO CURRENT_USER', schema_name);
          EXECUTE format('GRANT ALL ON ALL SEQUENCES IN SCHEMA %I TO CURRENT_USER', schema_name);
          RAISE NOTICE 'Tenant schema % created successfully', schema_name;
        END;
        $$ LANGUAGE plpgsql;
      `);

      // // Create setup tables function
      await queryRunner.query(`
        CREATE OR REPLACE FUNCTION setup_tenant_tables(tenant_slug VARCHAR)
        RETURNS VOID AS $$
        DECLARE
          schema_name VARCHAR := 'tenant_' || replace(tenant_slug, '-', '_');
        BEGIN
          EXECUTE format('SET search_path TO %I, public', schema_name);
          RAISE NOTICE 'Tables will be created in schema % by TypeORM', schema_name;
        END;
        $$ LANGUAGE plpgsql;
      `);

      // // Create onboard function
      await queryRunner.query(`
        CREATE OR REPLACE FUNCTION onboard_tenant(tenant_slug VARCHAR)
        RETURNS VOID AS $$
        BEGIN
          PERFORM create_tenant_schema(tenant_slug);
          PERFORM setup_tenant_tables(tenant_slug);
          RAISE NOTICE 'Tenant % fully onboarded', tenant_slug;
        END;
        $$ LANGUAGE plpgsql;
      `);

      // // Create tenant schemas view
      await queryRunner.query(`
        CREATE OR REPLACE VIEW tenant_schemas AS
        SELECT
          schema_name,
          substring(schema_name from 8) as tenant_id,
          pg_size_pretty(
            COALESCE(sum(pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename)))::bigint, 0)
          ) as total_size
        FROM information_schema.schemata
        LEFT JOIN LATERAL (
          SELECT schemaname, tablename
          FROM pg_tables
          WHERE schemaname = information_schema.schemata.schema_name
        ) t ON true
        WHERE schema_name LIKE 'tenant_%'
        GROUP BY schema_name
        ORDER BY schema_name;
      `);

      // // Create delete function
      await queryRunner.query(`
        CREATE OR REPLACE FUNCTION delete_tenant_schema(tenant_slug VARCHAR)
        RETURNS VOID AS $$
        DECLARE
          schema_name VARCHAR := 'tenant_' || replace(tenant_slug, '-', '_');
        BEGIN
          EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', schema_name);
          RAISE NOTICE 'Tenant schema % deleted', schema_name;
        END;
        $$ LANGUAGE plpgsql;
      `);
    } finally {
      await queryRunner.release();
    }
  }
}
