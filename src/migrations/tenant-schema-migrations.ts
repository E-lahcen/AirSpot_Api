import { QueryRunner } from 'typeorm';

/**
 * Interface for tenant schema migrations
 */
export interface TenantMigration {
  version: number;
  name: string;
  up: (queryRunner: QueryRunner, schema: string) => Promise<void>;
  down: (queryRunner: QueryRunner, schema: string) => Promise<void>;
  /**
   * Optional: skip this migration for tenant schemas
   * Useful for migrations that only apply to public schema (e.g., user_tenant table)
   */
  skip?: boolean;
}

/**
 * Helper functions for tenant migration tracking
 */
export const TenantMigrationHelpers = {
  /**
   * Ensure the migrations tracking table exists in a tenant schema
   */
  async ensureMigrationTable(
    queryRunner: QueryRunner,
    schema: string,
  ): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".tenant_migrations (
        id SERIAL PRIMARY KEY,
        version BIGINT NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
  },

  /**
   * Get list of applied migration versions
   */
  async getAppliedMigrations(
    queryRunner: QueryRunner,
    schema: string,
  ): Promise<number[]> {
    // First ensure the table exists
    await TenantMigrationHelpers.ensureMigrationTable(queryRunner, schema);

    const result = (await queryRunner.query(
      `SELECT version FROM "${schema}".tenant_migrations ORDER BY version ASC`,
    )) as Array<{ version: number }>;

    return result.map((row) => Number(row.version));
  },

  /**
   * Record a migration as applied
   */
  async recordMigration(
    queryRunner: QueryRunner,
    schema: string,
    migration: TenantMigration,
  ): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "${schema}".tenant_migrations (version, name) VALUES ($1, $2) ON CONFLICT (version) DO NOTHING`,
      [migration.version, migration.name],
    );
  },

  /**
   * Remove a migration record (for rollback)
   */
  async removeMigrationRecord(
    queryRunner: QueryRunner,
    schema: string,
    version: number,
  ): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "${schema}".tenant_migrations WHERE version = $1`,
      [version],
    );
  },
};

/**
 * Array of all tenant schema migrations
 *
 * IMPORTANT: Keep this in sync with public schema migrations!
 *
 * When you create a new public schema migration:
 * 1. Run: npm run migration:generate -- src/migrations/MigrationName
 * 2. Add a corresponding tenant migration below with matching version
 * 3. The version should match the timestamp in the public migration filename
 *
 * Example workflow:
 * - Public migration: src/migrations/1732234000000-AddPhoneNumber.ts
 * - Tenant migration: Add entry below with version: 1732234000000
 */
export const TENANT_MIGRATIONS: TenantMigration[] = [
  {
    version: 1732233600000,
    name: 'InitialSchema',
    up: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      // Ensure uuid-ossp extension is available
      await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

      // Create roles table
      await queryRunner.query(`
        CREATE TABLE "${schema}".roles (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "name" character varying(50) NOT NULL,
          "description" text,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_${schema}_roles" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_${schema}_roles_name" UNIQUE ("name")
        )
      `);

      // Create users table
      await queryRunner.query(`
        CREATE TABLE "${schema}".users (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "first_name" character varying(255),
          "last_name" character varying(255),
          "full_name" character varying(255),
          "company_name" character varying(255) NOT NULL,
          "email" character varying(255) NOT NULL,
          "firebase_uid" character varying(128) NOT NULL,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_${schema}_users" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_${schema}_users_email" UNIQUE ("email"),
          CONSTRAINT "UQ_${schema}_users_firebase_uid" UNIQUE ("firebase_uid")
        )
      `);

      // Create user-role junction table
      await queryRunner.query(`
        CREATE TABLE "${schema}".users_roles_roles (
          "user_id" uuid NOT NULL,
          "role_id" uuid NOT NULL,
          CONSTRAINT "PK_${schema}_users_roles" PRIMARY KEY ("user_id", "role_id")
        )
      `);

      // Create invitation enums in the tenant schema
      await queryRunner.query(`
        CREATE TYPE "${schema}".invitations_type_enum AS ENUM(
          'tenant_registration',
          'collaboration',
          'role_assignment',
          'resource_access',
          'event_participation',
          'document_review'
        )
      `);

      await queryRunner.query(`
        CREATE TYPE "${schema}".invitations_status_enum AS ENUM(
          'pending',
          'accepted',
          'expired',
          'revoked'
        )
      `);

      // Create invitations table
      await queryRunner.query(`
        CREATE TABLE "${schema}".invitations (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "email" character varying(255) NOT NULL,
          "invited_by" uuid NOT NULL,
          "type" "${schema}".invitations_type_enum NOT NULL DEFAULT 'tenant_registration',
          "role" character varying(50) NOT NULL DEFAULT 'member',
          "status" "${schema}".invitations_status_enum NOT NULL DEFAULT 'pending',
          "token" character varying(255) NOT NULL,
          "expires_at" TIMESTAMP NOT NULL,
          "metadata" jsonb,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_${schema}_invitations" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_${schema}_invitations_token" UNIQUE ("token")
        )
      `);

      // Add foreign key constraints
      await queryRunner.query(`
        ALTER TABLE "${schema}".users_roles_roles
        ADD CONSTRAINT "FK_${schema}_users_roles_user_id"
        FOREIGN KEY ("user_id") REFERENCES "${schema}".users("id")
        ON DELETE CASCADE ON UPDATE CASCADE
      `);

      await queryRunner.query(`
        ALTER TABLE "${schema}".users_roles_roles
        ADD CONSTRAINT "FK_${schema}_users_roles_role_id"
        FOREIGN KEY ("role_id") REFERENCES "${schema}".roles("id")
        ON DELETE CASCADE ON UPDATE CASCADE
      `);

      // Create indexes
      await queryRunner.query(`
        CREATE INDEX "IDX_${schema}_users_roles_user_id" ON "${schema}".users_roles_roles ("user_id")
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_${schema}_users_roles_role_id" ON "${schema}".users_roles_roles ("role_id")
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_${schema}_invitations_email" ON "${schema}".invitations ("email")
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_${schema}_invitations_status" ON "${schema}".invitations ("status")
      `);

      // Insert default roles
      await queryRunner.query(`
        INSERT INTO "${schema}".roles (name, description) VALUES
          ('owner', 'Company owner with full administrative access'),
          ('admin', 'Administrator with full access'),
          ('member', 'Regular member with limited access')
      `);
    },
    down: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      // Drop indexes
      await queryRunner.query(
        `DROP INDEX IF EXISTS "${schema}"."IDX_${schema}_invitations_status"`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS "${schema}"."IDX_${schema}_invitations_email"`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS "${schema}"."IDX_${schema}_users_roles_role_id"`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS "${schema}"."IDX_${schema}_users_roles_user_id"`,
      );

      // Drop foreign key constraints
      await queryRunner.query(
        `ALTER TABLE "${schema}".users_roles_roles DROP CONSTRAINT IF EXISTS "FK_${schema}_users_roles_role_id"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".users_roles_roles DROP CONSTRAINT IF EXISTS "FK_${schema}_users_roles_user_id"`,
      );

      // Drop tables
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}".invitations`);
      await queryRunner.query(
        `DROP TYPE IF EXISTS "${schema}".invitations_status_enum`,
      );
      await queryRunner.query(
        `DROP TYPE IF EXISTS "${schema}".invitations_type_enum`,
      );
      await queryRunner.query(
        `DROP TABLE IF EXISTS "${schema}".users_roles_roles`,
      );
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}".users`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}".roles`);
    },
  },
  {
    version: 1763914988652,
    name: 'UpdateTenantEntityAndAddedOthers',
    up: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      // Add deleted_at column to roles table
      await queryRunner.query(`
        ALTER TABLE "${schema}".roles ADD "deleted_at" TIMESTAMP
      `);

      // Create campaign enums in the tenant schema
      await queryRunner.query(`
        CREATE TYPE "${schema}".campaigns_goal_enum AS ENUM(
          'AWARENESS',
          'CONVERSIONS',
          'TRAFFIC',
          'RETARGET',
          'APP_REVENUE'
        )
      `);

      await queryRunner.query(`
        CREATE TYPE "${schema}".campaigns_budget_type_enum AS ENUM(
          'LIFETIME',
          'DAILY'
        )
      `);

      await queryRunner.query(`
        CREATE TYPE "${schema}".campaigns_status_enum AS ENUM(
          'DRAFT',
          'PENDING_VERIFICATION',
          'VERIFIED',
          'ACTIVE',
          'PAUSED',
          'COMPLETED',
          'REJECTED'
        )
      `);

      // Create campaigns table
      await queryRunner.query(`
        CREATE TABLE "${schema}".campaigns (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMP,
          "organization_id" uuid NOT NULL,
          "name" character varying(255) NOT NULL,
          "goal" "${schema}".campaigns_goal_enum NOT NULL,
          "budget_type" "${schema}".campaigns_budget_type_enum NOT NULL,
          "budget_amount" numeric(10,2) NOT NULL,
          "start_date" TIMESTAMP NOT NULL,
          "end_date" TIMESTAMP NOT NULL,
          "status" "${schema}".campaigns_status_enum NOT NULL DEFAULT 'DRAFT',
          "published_at" TIMESTAMP,
          CONSTRAINT "PK_${schema}_campaigns" PRIMARY KEY ("id")
        )
      `);

      // Create creatives table
      await queryRunner.query(`
        CREATE TABLE "${schema}".creatives (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMP,
          "organization_id" uuid NOT NULL,
          "name" character varying(255) NOT NULL,
          "description" text,
          "file_name" character varying(500) NOT NULL,
          "s3_key" character varying(500) NOT NULL,
          "s3_bucket" character varying(255) NOT NULL DEFAULT 'airspot-ctv-assets',
          "file_size" bigint NOT NULL,
          "mime_type" character varying(100) NOT NULL,
          "duration" integer,
          "thumbnail_s3_key" character varying(500),
          CONSTRAINT "PK_${schema}_creatives" PRIMARY KEY ("id")
        )
      `);

      // Create ad_variations bidding strategy enum
      await queryRunner.query(`
        CREATE TYPE "${schema}".ad_variations_bidding_strategy_enum AS ENUM(
          'AUTOMATIC',
          'MANUAL_CPM'
        )
      `);

      // Create ad_variations table
      await queryRunner.query(`
        CREATE TABLE "${schema}".ad_variations (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMP,
          "organization_id" uuid NOT NULL,
          "campaign_id" uuid NOT NULL,
          "name" character varying(255) NOT NULL,
          "creative_id" uuid,
          "bidding_strategy" "${schema}".ad_variations_bidding_strategy_enum NOT NULL DEFAULT 'AUTOMATIC',
          "cpm_bid" numeric(10,2),
          CONSTRAINT "PK_${schema}_ad_variations" PRIMARY KEY ("id")
        )
      `);

      // Create target_group_selections type enum
      await queryRunner.query(`
        CREATE TYPE "${schema}".target_group_selections_type_enum AS ENUM(
          'DEMOGRAPHIC',
          'INTEREST',
          'GEOGRAPHY',
          'BEHAVIOR',
          'CHANNEL',
          'DELIVERY_TIME'
        )
      `);

      // Create target_group_selections table
      await queryRunner.query(`
        CREATE TABLE "${schema}".target_group_selections (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMP,
          "organization_id" uuid NOT NULL,
          "variation_id" uuid NOT NULL,
          "type" "${schema}".target_group_selections_type_enum NOT NULL,
          "provider_id" integer NOT NULL,
          "target_id" character varying(255) NOT NULL,
          CONSTRAINT "PK_${schema}_target_group_selections" PRIMARY KEY ("id")
        )
      `);

      // Create user_roles table
      await queryRunner.query(`
        CREATE TABLE "${schema}".user_roles (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "user_id" uuid NOT NULL,
          "role_id" uuid NOT NULL,
          "is_active" boolean NOT NULL DEFAULT true,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_${schema}_user_roles" PRIMARY KEY ("id")
        )
      `);

      // Add foreign key constraints for ad_variations
      await queryRunner.query(`
        ALTER TABLE "${schema}".ad_variations
        ADD CONSTRAINT "FK_${schema}_ad_variations_campaign"
        FOREIGN KEY ("campaign_id") REFERENCES "${schema}".campaigns("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
      `);

      await queryRunner.query(`
        ALTER TABLE "${schema}".ad_variations
        ADD CONSTRAINT "FK_${schema}_ad_variations_creative"
        FOREIGN KEY ("creative_id") REFERENCES "${schema}".creatives("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
      `);

      // Add foreign key constraint for target_group_selections
      await queryRunner.query(`
        ALTER TABLE "${schema}".target_group_selections
        ADD CONSTRAINT "FK_${schema}_target_group_selections_variation"
        FOREIGN KEY ("variation_id") REFERENCES "${schema}".ad_variations("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
      `);

      // Add foreign key constraints for user_roles
      await queryRunner.query(`
        ALTER TABLE "${schema}".user_roles
        ADD CONSTRAINT "FK_${schema}_user_roles_user"
        FOREIGN KEY ("user_id") REFERENCES "${schema}".users("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
      `);

      await queryRunner.query(`
        ALTER TABLE "${schema}".user_roles
        ADD CONSTRAINT "FK_${schema}_user_roles_role"
        FOREIGN KEY ("role_id") REFERENCES "${schema}".roles("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
      `);
    },
    down: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      // Drop foreign key constraints
      await queryRunner.query(
        `ALTER TABLE "${schema}".user_roles DROP CONSTRAINT IF EXISTS "FK_${schema}_user_roles_role"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".user_roles DROP CONSTRAINT IF EXISTS "FK_${schema}_user_roles_user"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".target_group_selections DROP CONSTRAINT IF EXISTS "FK_${schema}_target_group_selections_variation"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".ad_variations DROP CONSTRAINT IF EXISTS "FK_${schema}_ad_variations_creative"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".ad_variations DROP CONSTRAINT IF EXISTS "FK_${schema}_ad_variations_campaign"`,
      );

      // Drop tables
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}".user_roles`);
      await queryRunner.query(
        `DROP TABLE IF EXISTS "${schema}".target_group_selections`,
      );
      await queryRunner.query(
        `DROP TYPE IF EXISTS "${schema}".target_group_selections_type_enum`,
      );
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}".ad_variations`);
      await queryRunner.query(
        `DROP TYPE IF EXISTS "${schema}".ad_variations_bidding_strategy_enum`,
      );
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}".creatives`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}".campaigns`);
      await queryRunner.query(
        `DROP TYPE IF EXISTS "${schema}".campaigns_status_enum`,
      );
      await queryRunner.query(
        `DROP TYPE IF EXISTS "${schema}".campaigns_budget_type_enum`,
      );
      await queryRunner.query(
        `DROP TYPE IF EXISTS "${schema}".campaigns_goal_enum`,
      );

      // Remove deleted_at column from roles table
      await queryRunner.query(
        `ALTER TABLE "${schema}".roles DROP COLUMN IF EXISTS "deleted_at"`,
      );
    },
  },
  {
    version: 1763916003624,
    name: 'RemoveTenantOwnerFk',
    up: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      // Remove deleted_at column from roles table (changing its type)
      await queryRunner.query(
        `ALTER TABLE "${schema}".roles DROP COLUMN IF EXISTS "deleted_at"`,
      );

      // Add deleted_at column back to roles table with new type
      await queryRunner.query(`
        ALTER TABLE "${schema}".roles ADD "deleted_at" TIMESTAMP
      `);
    },
    down: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      // Remove deleted_at column from roles table
      await queryRunner.query(
        `ALTER TABLE "${schema}".roles DROP COLUMN IF EXISTS "deleted_at"`,
      );

      // Add deleted_at column back to roles table with old type
      await queryRunner.query(`
        ALTER TABLE "${schema}".roles ADD "deleted_at" TIMESTAMP
      `);
    },
  },
  {
    version: 1763917837527,
    name: 'RemoveOrganisationFromEntities',
    up: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      // Drop foreign key constraints from campaigns
      await queryRunner.query(
        `ALTER TABLE "${schema}".campaigns DROP CONSTRAINT IF EXISTS "FK_${schema}_campaigns_organization"`,
      );

      // Drop foreign key constraints from target_group_selections
      await queryRunner.query(
        `ALTER TABLE "${schema}".target_group_selections DROP CONSTRAINT IF EXISTS "FK_${schema}_target_group_selections_organization"`,
      );

      // Drop foreign key constraints from ad_variations
      await queryRunner.query(
        `ALTER TABLE "${schema}".ad_variations DROP CONSTRAINT IF EXISTS "FK_${schema}_ad_variations_organization"`,
      );

      // Drop foreign key constraints from creatives
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives DROP CONSTRAINT IF EXISTS "FK_${schema}_creatives_organization"`,
      );

      // Remove deleted_at column from roles table (changing its type)
      await queryRunner.query(
        `ALTER TABLE "${schema}".roles DROP COLUMN IF EXISTS "deleted_at"`,
      );

      // Add deleted_at column back to roles table
      await queryRunner.query(`
        ALTER TABLE "${schema}".roles ADD "deleted_at" TIMESTAMP
      `);
    },
    down: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      // Remove deleted_at column from roles table
      await queryRunner.query(
        `ALTER TABLE "${schema}".roles DROP COLUMN IF EXISTS "deleted_at"`,
      );

      // Add deleted_at column back to roles table
      await queryRunner.query(`
        ALTER TABLE "${schema}".roles ADD "deleted_at" TIMESTAMP
      `);

      // Add foreign key constraints back to creatives
      await queryRunner.query(`
        ALTER TABLE "${schema}".creatives
        ADD CONSTRAINT "FK_${schema}_creatives_organization"
        FOREIGN KEY ("organization_id") REFERENCES "public"."tenants"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
      `);

      // Add foreign key constraints back to ad_variations
      await queryRunner.query(`
        ALTER TABLE "${schema}".ad_variations
        ADD CONSTRAINT "FK_${schema}_ad_variations_organization"
        FOREIGN KEY ("organization_id") REFERENCES "public"."tenants"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
      `);

      // Add foreign key constraints back to target_group_selections
      await queryRunner.query(`
        ALTER TABLE "${schema}".target_group_selections
        ADD CONSTRAINT "FK_${schema}_target_group_selections_organization"
        FOREIGN KEY ("organization_id") REFERENCES "public"."tenants"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
      `);

      // Add foreign key constraints back to campaigns
      await queryRunner.query(`
        ALTER TABLE "${schema}".campaigns
        ADD CONSTRAINT "FK_${schema}_campaigns_organization"
        FOREIGN KEY ("organization_id") REFERENCES "public"."tenants"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
      `);
    },
  },
  {
    version: 1763919549258,
    name: 'AddOwnerIdToEntities',
    up: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      // Remove deleted_at column from roles table (changing its type)
      await queryRunner.query(
        `ALTER TABLE "${schema}".roles DROP COLUMN IF EXISTS "deleted_at"`,
      );

      // Add deleted_at column back to roles table
      await queryRunner.query(`
        ALTER TABLE "${schema}".roles ADD "deleted_at" TIMESTAMP
      `);

      // Add owner_id column to campaigns
      await queryRunner.query(`
        ALTER TABLE "${schema}".campaigns ADD "owner_id" uuid NOT NULL
      `);

      // Add owner_id column to target_group_selections
      await queryRunner.query(`
        ALTER TABLE "${schema}".target_group_selections ADD "owner_id" uuid NOT NULL
      `);

      // Add owner_id column to ad_variations
      await queryRunner.query(`
        ALTER TABLE "${schema}".ad_variations ADD "owner_id" uuid NOT NULL
      `);

      // Add owner_id column to creatives
      await queryRunner.query(`
        ALTER TABLE "${schema}".creatives ADD "owner_id" uuid NOT NULL
      `);

      // Add foreign key constraints for owner_id in campaigns
      await queryRunner.query(`
        ALTER TABLE "${schema}".campaigns
        ADD CONSTRAINT "FK_${schema}_campaigns_owner"
        FOREIGN KEY ("owner_id") REFERENCES "${schema}".users("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
      `);

      // Add foreign key constraints for owner_id in target_group_selections
      await queryRunner.query(`
        ALTER TABLE "${schema}".target_group_selections
        ADD CONSTRAINT "FK_${schema}_target_group_selections_owner"
        FOREIGN KEY ("owner_id") REFERENCES "${schema}".users("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
      `);

      // Add foreign key constraints for owner_id in ad_variations
      await queryRunner.query(`
        ALTER TABLE "${schema}".ad_variations
        ADD CONSTRAINT "FK_${schema}_ad_variations_owner"
        FOREIGN KEY ("owner_id") REFERENCES "${schema}".users("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
      `);

      // Add foreign key constraints for owner_id in creatives
      await queryRunner.query(`
        ALTER TABLE "${schema}".creatives
        ADD CONSTRAINT "FK_${schema}_creatives_owner"
        FOREIGN KEY ("owner_id") REFERENCES "${schema}".users("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
      `);
    },
    down: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      // Drop foreign key constraints for owner_id in creatives
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives DROP CONSTRAINT IF EXISTS "FK_${schema}_creatives_owner"`,
      );

      // Drop foreign key constraints for owner_id in ad_variations
      await queryRunner.query(
        `ALTER TABLE "${schema}".ad_variations DROP CONSTRAINT IF EXISTS "FK_${schema}_ad_variations_owner"`,
      );

      // Drop foreign key constraints for owner_id in target_group_selections
      await queryRunner.query(
        `ALTER TABLE "${schema}".target_group_selections DROP CONSTRAINT IF EXISTS "FK_${schema}_target_group_selections_owner"`,
      );

      // Drop foreign key constraints for owner_id in campaigns
      await queryRunner.query(
        `ALTER TABLE "${schema}".campaigns DROP CONSTRAINT IF EXISTS "FK_${schema}_campaigns_owner"`,
      );

      // Remove owner_id column from creatives
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "owner_id"`,
      );

      // Remove owner_id column from ad_variations
      await queryRunner.query(
        `ALTER TABLE "${schema}".ad_variations DROP COLUMN IF EXISTS "owner_id"`,
      );

      // Remove owner_id column from target_group_selections
      await queryRunner.query(
        `ALTER TABLE "${schema}".target_group_selections DROP COLUMN IF EXISTS "owner_id"`,
      );

      // Remove owner_id column from campaigns
      await queryRunner.query(
        `ALTER TABLE "${schema}".campaigns DROP COLUMN IF EXISTS "owner_id"`,
      );

      // Remove deleted_at column from roles table
      await queryRunner.query(
        `ALTER TABLE "${schema}".roles DROP COLUMN IF EXISTS "deleted_at"`,
      );

      // Add deleted_at column back to roles table
      await queryRunner.query(`
        ALTER TABLE "${schema}".roles ADD "deleted_at" TIMESTAMP
      `);
    },
  },
  {
    version: 1764414355796,
    name: 'UserTenantEntity',
    skip: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    up: async (_queryRunner: QueryRunner, _schema: string): Promise<void> => {
      // This migration only applies to public schema, not tenant schemas
      // Skipped for tenant schemas via skip: true
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    down: async (_queryRunner: QueryRunner, _schema: string): Promise<void> => {
      // This migration only applies to public schema, not tenant schemas
      // Skipped for tenant schemas via skip: true
    },
  },
  {
    version: 1764415176775,
    name: 'UserTenantEntityUpdated',
    skip: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    up: async (_queryRunner: QueryRunner, _schema: string): Promise<void> => {
      // This migration only applies to public schema, not tenant schemas
      // Skipped for tenant schemas via skip: true
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    down: async (_queryRunner: QueryRunner, _schema: string): Promise<void> => {
      // This migration only applies to public schema, not tenant schemas
      // Skipped for tenant schemas via skip: true
    },
  },
  {
    version: 1764243000000,
    name: 'AddOrganizationMetadataToTenants',
    skip: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    up: async (_queryRunner: QueryRunner, _schema: string): Promise<void> => {
      // This migration only applies to public schema (tenants table), not tenant schemas
      // Skipped for tenant schemas via skip: true
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    down: async (_queryRunner: QueryRunner, _schema: string): Promise<void> => {
      // This migration only applies to public schema (tenants table), not tenant schemas
      // Skipped for tenant schemas via skip: true
    },
  },
  {
    version: 1764438816992,
    name: 'TemplateStoryboardEntities',
    up: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      // Create templates table
      await queryRunner.query(`
        CREATE TABLE "${schema}".templates (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMP,
          "organization_id" uuid NOT NULL,
          "name" character varying(255) NOT NULL,
          "description" text,
          "orientation" character varying(50) NOT NULL,
          "theme" character varying(100) NOT NULL,
          "video_position" character varying(50) NOT NULL,
          "brand_name" character varying(255) NOT NULL,
          "price" character varying(50) NOT NULL,
          "product_name" character varying(255) NOT NULL,
          "features" text array NOT NULL DEFAULT '{}',
          "show_qr_code" boolean NOT NULL DEFAULT false,
          "qr_code_text" character varying(500),
          "logo_path" character varying(500),
          "product_image_path" character varying(500),
          "video_path" character varying(500),
          "template_image_path" character varying(500),
          "owner_id" uuid NOT NULL,
          CONSTRAINT "PK_${schema}_templates" PRIMARY KEY ("id")
        )
      `);

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
          "scenes_data" jsonb NOT NULL,
          "video_url" character varying(500) NOT NULL,
          "owner_id" uuid NOT NULL,
          CONSTRAINT "PK_${schema}_storyboards" PRIMARY KEY ("id")
        )
      `);

      // Add foreign key constraints for templates
      await queryRunner.query(`
        ALTER TABLE "${schema}".templates
        ADD CONSTRAINT "FK_${schema}_templates_owner"
        FOREIGN KEY ("owner_id") REFERENCES "${schema}".users("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
      `);

      // Add foreign key constraints for storyboards
      await queryRunner.query(`
        ALTER TABLE "${schema}".storyboards
        ADD CONSTRAINT "FK_${schema}_storyboards_owner"
        FOREIGN KEY ("owner_id") REFERENCES "${schema}".users("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
      `);
    },
    down: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      // Drop foreign key constraints
      await queryRunner.query(
        `ALTER TABLE "${schema}".storyboards DROP CONSTRAINT IF EXISTS "FK_${schema}_storyboards_owner"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".templates DROP CONSTRAINT IF EXISTS "FK_${schema}_templates_owner"`,
      );

      // Drop tables
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}".storyboards`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}".templates`);
    },
  },
  {
    version: 1764451387072,
    name: 'CreativeEntityUpdate',
    up: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "file_name"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "s3_key"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "s3_bucket"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "file_size"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "mime_type"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "duration"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "thumbnail_s3_key"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "end_duration"`);

      await queryRunner.query(`ALTER TABLE "${schema}".creatives ADD "orientation" character varying(50)`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives ADD "theme" character varying(50)`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives ADD "video_position" character varying(50)`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives ADD "brand_name" character varying(255)`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives ADD "price" character varying(50)`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives ADD "product_name" character varying(255)`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives ADD "features" text array`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives ADD "show_qr_code" boolean NOT NULL DEFAULT false`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives ADD "qr_code_text" character varying(500)`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives ADD "logo_path" character varying(500)`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives ADD "product_image_path" character varying(500)`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives ADD "video_path" character varying(500)`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives ADD "template_image_path" character varying(500)`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives ADD "filename" character varying(500)`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives ADD "campaign_count" integer NOT NULL DEFAULT '0'`);
    },
    down: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "thumbnail_s3_key"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "end_duration"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "duration"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "mime_type"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "file_size"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "s3_bucket"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "s3_key"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "file_name"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "campaign_count"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "filename"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "template_image_path"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "video_path"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "product_image_path"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "logo_path"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "qr_code_text"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "show_qr_code"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "features"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "product_name"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "price"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "brand_name"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "video_position"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "theme"`);
      await queryRunner.query(`ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "orientation"`);
    },
  },
  {
    version: 1764457409357,
    name: 'CreativeEntityUpdate',
    up: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      // Remove old storage columns, keep file_name
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "s3_key"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "s3_bucket"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "file_size"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "mime_type"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "duration"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "thumbnail_s3_key"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "end_duration"`,
      );

      // Add new creative fields (if they don't exist yet)
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives ADD COLUMN IF NOT EXISTS "orientation" character varying(50)`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives ADD COLUMN IF NOT EXISTS "theme" character varying(50)`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives ADD COLUMN IF NOT EXISTS "video_position" character varying(50)`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives ADD COLUMN IF NOT EXISTS "brand_name" character varying(255)`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives ADD COLUMN IF NOT EXISTS "price" character varying(50)`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives ADD COLUMN IF NOT EXISTS "product_name" character varying(255)`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives ADD COLUMN IF NOT EXISTS "features" text[]`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives ADD COLUMN IF NOT EXISTS "show_qr_code" boolean NOT NULL DEFAULT false`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives ADD COLUMN IF NOT EXISTS "qr_code_text" character varying(500)`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives ADD COLUMN IF NOT EXISTS "logo_path" character varying(500)`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives ADD COLUMN IF NOT EXISTS "product_image_path" character varying(500)`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives ADD COLUMN IF NOT EXISTS "video_path" character varying(500)`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives ADD COLUMN IF NOT EXISTS "template_image_path" character varying(500)`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives ADD COLUMN IF NOT EXISTS "campaign_count" integer NOT NULL DEFAULT 0`,
      );

      // NOTE: file_name already exists, and we keep it.
      // NOTE: owner_id was added in the AddOwnerIdToEntities migration.
    },

    down: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      // Drop new fields
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "campaign_count"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "template_image_path"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "video_path"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "product_image_path"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "logo_path"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "qr_code_text"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "show_qr_code"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "features"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "product_name"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "price"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "brand_name"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "video_position"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "theme"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives DROP COLUMN IF EXISTS "orientation"`,
      );

      // Recreate old storage columns
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives ADD COLUMN IF NOT EXISTS "end_duration" integer`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives ADD COLUMN IF NOT EXISTS "thumbnail_s3_key" character varying(500)`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives ADD COLUMN IF NOT EXISTS "duration" integer`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives ADD COLUMN IF NOT EXISTS "mime_type" character varying(100) NOT NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives ADD COLUMN IF NOT EXISTS "file_size" bigint NOT NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives ADD COLUMN IF NOT EXISTS "s3_bucket" character varying(255) NOT NULL DEFAULT 'airspot-ctv-assets'`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}".creatives ADD COLUMN IF NOT EXISTS "s3_key" character varying(500) NOT NULL`,
      );

      // file_name stays; we don't touch it
    },
  }

];
