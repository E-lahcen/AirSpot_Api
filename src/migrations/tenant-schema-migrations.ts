import { QueryRunner } from 'typeorm';

// const UUID_DEFAULT = '(md5(random()::text || clock_timestamp()::text)::uuid)';

/**
 * Interface for tenant schema migrations
 */
export interface TenantMigration {
  version: number;
  name: string;
  up: (queryRunner: QueryRunner, schema: string) => Promise<void>;
  down: (queryRunner: QueryRunner, schema: string) => Promise<void>;
  skip?: boolean;
}

/**
 * Helper functions for tenant migration tracking
 */
export const TenantMigrationHelpers = {
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

  async getAppliedMigrations(
    queryRunner: QueryRunner,
    schema: string,
  ): Promise<number[]> {
    await TenantMigrationHelpers.ensureMigrationTable(queryRunner, schema);
    const result = (await queryRunner.query(
      `SELECT version FROM "${schema}".tenant_migrations ORDER BY version ASC`,
    )) as Array<{ version: number }>;
    return result.map((row) => Number(row.version));
  },

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

export const TENANT_MIGRATIONS: TenantMigration[] = [
  {
    version: 1764541263018,
    name: 'InitialMigration',
    up: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      // Ensure uuid-ossp extension is available first
      await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

      // Create roles table
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".roles (
          id uuid NOT NULL DEFAULT uuid_generate_v4(),
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          updated_at TIMESTAMP NOT NULL DEFAULT now(),
          deleted_at TIMESTAMP,
          name character varying(50) NOT NULL,
          description text,
          CONSTRAINT "UQ_${schema}_roles_name" UNIQUE (name),
          CONSTRAINT "PK_${schema}_roles" PRIMARY KEY (id)
        )
      `);

      // Create users table
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".users (
          id uuid NOT NULL DEFAULT uuid_generate_v4(),
          first_name character varying(255),
          last_name character varying(255),
          full_name character varying(255),
          company_name character varying(255) NOT NULL,
          email character varying(255) NOT NULL,
          firebase_uid character varying(128) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          updated_at TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "UQ_${schema}_users_email" UNIQUE (email),
          CONSTRAINT "UQ_${schema}_users_firebase_uid" UNIQUE (firebase_uid),
          CONSTRAINT "PK_${schema}_users" PRIMARY KEY (id)
        )
      `);

      // Create users_roles_roles junction table
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".users_roles_roles (
          user_id uuid NOT NULL,
          role_id uuid NOT NULL,
          CONSTRAINT "PK_${schema}_users_roles" PRIMARY KEY (user_id, role_id)
        )
      `);

      // Create indexes on users_roles_roles
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_${schema}_users_roles_user" ON "${schema}".users_roles_roles (user_id)
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_${schema}_users_roles_role" ON "${schema}".users_roles_roles (role_id)
      `);

      // Create invitation type enum
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE "${schema}".invitations_type_enum AS ENUM('tenant_registration', 'collaboration', 'role_assignment', 'resource_access', 'event_participation', 'document_review');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Create invitation status enum
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE "${schema}".invitations_status_enum AS ENUM('pending', 'accepted', 'expired', 'revoked');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Create invitations table
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".invitations (
          id uuid NOT NULL DEFAULT uuid_generate_v4(),
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          updated_at TIMESTAMP NOT NULL DEFAULT now(),
          deleted_at TIMESTAMP,
          email character varying NOT NULL,
          invitor_id uuid NOT NULL,
          type "${schema}".invitations_type_enum NOT NULL DEFAULT 'tenant_registration',
          tenant_id uuid NOT NULL,
          tenant_slug character varying NOT NULL,
          role_id uuid,
          status "${schema}".invitations_status_enum NOT NULL DEFAULT 'pending',
          token character varying NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          metadata jsonb,
          CONSTRAINT "UQ_${schema}_invitations_token" UNIQUE (token),
          CONSTRAINT "PK_${schema}_invitations" PRIMARY KEY (id)
        )
      `);

      // Create templates table
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".templates (
          id uuid NOT NULL DEFAULT uuid_generate_v4(),
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          updated_at TIMESTAMP NOT NULL DEFAULT now(),
          deleted_at TIMESTAMP,
          organization_id uuid NOT NULL,
          name character varying(255) NOT NULL,
          description text,
          orientation character varying(50) NOT NULL,
          theme character varying(100) NOT NULL,
          video_position character varying(50) NOT NULL,
          brand_name character varying(255) NOT NULL,
          price character varying(50) NOT NULL,
          product_name character varying(255) NOT NULL,
          features text[] NOT NULL DEFAULT '{}',
          show_qr_code boolean NOT NULL DEFAULT false,
          qr_code_text character varying(500),
          logo_path character varying(500),
          product_image_path character varying(500),
          video_path character varying(500),
          template_image_path character varying(500),
          owner_id uuid NOT NULL,
          CONSTRAINT "PK_${schema}_templates" PRIMARY KEY (id)
        )
      `);

      // Create storyboards table
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".storyboards (
          id uuid NOT NULL DEFAULT uuid_generate_v4(),
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          updated_at TIMESTAMP NOT NULL DEFAULT now(),
          deleted_at TIMESTAMP,
          organization_id uuid NOT NULL,
          title character varying(255) NOT NULL,
          duration character varying(50) NOT NULL,
          scenes text NOT NULL,
          scenes_data jsonb NOT NULL,
          video_url character varying(500) NOT NULL,
          owner_id uuid NOT NULL,
          CONSTRAINT "PK_${schema}_storyboards" PRIMARY KEY (id)
        )
      `);

      // Create campaign goal enum
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE "${schema}".campaigns_goal_enum AS ENUM('AWARENESS', 'CONVERSIONS', 'TRAFFIC', 'RETARGET', 'APP_REVENUE');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Create campaign budget type enum
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE "${schema}".campaigns_budget_type_enum AS ENUM('LIFETIME', 'DAILY');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Create campaign status enum
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE "${schema}".campaigns_status_enum AS ENUM('DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'REJECTED');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Create campaigns table
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".campaigns (
          id uuid NOT NULL DEFAULT uuid_generate_v4(),
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          updated_at TIMESTAMP NOT NULL DEFAULT now(),
          deleted_at TIMESTAMP,
          organization_id uuid NOT NULL,
          name character varying(255) NOT NULL,
          goal "${schema}".campaigns_goal_enum NOT NULL,
          budget_type "${schema}".campaigns_budget_type_enum NOT NULL,
          budget_amount numeric(10,2) NOT NULL,
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP NOT NULL,
          status "${schema}".campaigns_status_enum NOT NULL DEFAULT 'DRAFT',
          owner_id uuid NOT NULL,
          published_at TIMESTAMP,
          CONSTRAINT "PK_${schema}_campaigns" PRIMARY KEY (id)
        )
      `);

      // Create audience type enum
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE "${schema}".audiences_type_enum AS ENUM('Demographic', 'Interest', 'Geography', 'Behavior', 'Channel', 'Delivery Time');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Create audiences table
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".audiences (
          id uuid NOT NULL DEFAULT uuid_generate_v4(),
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          updated_at TIMESTAMP NOT NULL DEFAULT now(),
          deleted_at TIMESTAMP,
          organization_id uuid NOT NULL,
          variation_id uuid,
          type "${schema}".audiences_type_enum NOT NULL,
          provider_id integer,
          target_id character varying(255),
          owner_id uuid NOT NULL,
          name character varying(255) NOT NULL,
          size character varying(255) NOT NULL,
          reached character varying(255) NOT NULL,
          platforms json,
          campaigns json,
          selected_locations json,
          selected_interests json,
          age_range json,
          selected_genders json,
          CONSTRAINT "PK_${schema}_audiences" PRIMARY KEY (id)
        )
      `);

      // Create ad variations bidding strategy enum
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE "${schema}".ad_variations_bidding_strategy_enum AS ENUM('AUTOMATIC', 'MANUAL_CPM');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Create ad_variations table
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".ad_variations (
          id uuid NOT NULL DEFAULT uuid_generate_v4(),
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          updated_at TIMESTAMP NOT NULL DEFAULT now(),
          deleted_at TIMESTAMP,
          organization_id uuid NOT NULL,
          campaign_id uuid NOT NULL,
          name character varying(255) NOT NULL,
          creative_id uuid,
          bidding_strategy "${schema}".ad_variations_bidding_strategy_enum NOT NULL DEFAULT 'AUTOMATIC',
          cpm_bid numeric(10,2),
          owner_id uuid NOT NULL,
          CONSTRAINT "PK_${schema}_ad_variations" PRIMARY KEY (id)
        )
      `);

      // Create creatives table
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".creatives (
          id uuid NOT NULL DEFAULT uuid_generate_v4(),
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          updated_at TIMESTAMP NOT NULL DEFAULT now(),
          deleted_at TIMESTAMP,
          organization_id uuid NOT NULL,
          name character varying(255) NOT NULL,
          description text,
          orientation character varying(50),
          theme character varying(50),
          video_position character varying(50),
          brand_name character varying(255),
          price character varying(50),
          product_name character varying(255),
          features text[],
          show_qr_code boolean NOT NULL DEFAULT false,
          qr_code_text character varying(500),
          logo_path character varying(500),
          product_image_path character varying(500),
          video_path character varying(500),
          template_image_path character varying(500),
          file_name character varying(500) NOT NULL,
          campaign_count integer NOT NULL DEFAULT 0,
          owner_id uuid NOT NULL,
          CONSTRAINT "PK_${schema}_creatives" PRIMARY KEY (id)
        )
      `);

      // Add foreign key constraints
      await queryRunner.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'FK_${schema}_users_roles_user'
          ) THEN
            ALTER TABLE "${schema}".users_roles_roles 
            ADD CONSTRAINT "FK_${schema}_users_roles_user" 
            FOREIGN KEY (user_id) REFERENCES "${schema}".users(id) 
            ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `);

      await queryRunner.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'FK_${schema}_users_roles_role'
          ) THEN
            ALTER TABLE "${schema}".users_roles_roles 
            ADD CONSTRAINT "FK_${schema}_users_roles_role" 
            FOREIGN KEY (role_id) REFERENCES "${schema}".roles(id) 
            ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `);

      await queryRunner.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'FK_${schema}_invitations_invitor'
          ) THEN
            ALTER TABLE "${schema}".invitations 
            ADD CONSTRAINT "FK_${schema}_invitations_invitor" 
            FOREIGN KEY (invitor_id) REFERENCES "${schema}".users(id) 
            ON DELETE NO ACTION ON UPDATE NO ACTION;
          END IF;
        END $$;
      `);

      await queryRunner.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'FK_${schema}_invitations_role'
          ) THEN
            ALTER TABLE "${schema}".invitations 
            ADD CONSTRAINT "FK_${schema}_invitations_role" 
            FOREIGN KEY (role_id) REFERENCES "${schema}".roles(id) 
            ON DELETE NO ACTION ON UPDATE NO ACTION;
          END IF;
        END $$;
      `);

      await queryRunner.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'FK_${schema}_templates_owner'
          ) THEN
            ALTER TABLE "${schema}".templates 
            ADD CONSTRAINT "FK_${schema}_templates_owner" 
            FOREIGN KEY (owner_id) REFERENCES "${schema}".users(id) 
            ON DELETE NO ACTION ON UPDATE NO ACTION;
          END IF;
        END $$;
      `);

      await queryRunner.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'FK_${schema}_storyboards_owner'
          ) THEN
            ALTER TABLE "${schema}".storyboards 
            ADD CONSTRAINT "FK_${schema}_storyboards_owner" 
            FOREIGN KEY (owner_id) REFERENCES "${schema}".users(id) 
            ON DELETE NO ACTION ON UPDATE NO ACTION;
          END IF;
        END $$;
      `);

      await queryRunner.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'FK_${schema}_campaigns_owner'
          ) THEN
            ALTER TABLE "${schema}".campaigns 
            ADD CONSTRAINT "FK_${schema}_campaigns_owner" 
            FOREIGN KEY (owner_id) REFERENCES "${schema}".users(id) 
            ON DELETE NO ACTION ON UPDATE NO ACTION;
          END IF;
        END $$;
      `);

      await queryRunner.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'FK_${schema}_audiences_owner'
          ) THEN
            ALTER TABLE "${schema}".audiences 
            ADD CONSTRAINT "FK_${schema}_audiences_owner" 
            FOREIGN KEY (owner_id) REFERENCES "${schema}".users(id) 
            ON DELETE NO ACTION ON UPDATE NO ACTION;
          END IF;
        END $$;
      `);

      await queryRunner.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'FK_${schema}_audiences_variation'
          ) THEN
            ALTER TABLE "${schema}".audiences 
            ADD CONSTRAINT "FK_${schema}_audiences_variation" 
            FOREIGN KEY (variation_id) REFERENCES "${schema}".ad_variations(id) 
            ON DELETE NO ACTION ON UPDATE NO ACTION;
          END IF;
        END $$;
      `);

      await queryRunner.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'FK_${schema}_ad_variations_owner'
          ) THEN
            ALTER TABLE "${schema}".ad_variations 
            ADD CONSTRAINT "FK_${schema}_ad_variations_owner" 
            FOREIGN KEY (owner_id) REFERENCES "${schema}".users(id) 
            ON DELETE NO ACTION ON UPDATE NO ACTION;
          END IF;
        END $$;
      `);

      await queryRunner.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'FK_${schema}_ad_variations_campaign'
          ) THEN
            ALTER TABLE "${schema}".ad_variations 
            ADD CONSTRAINT "FK_${schema}_ad_variations_campaign" 
            FOREIGN KEY (campaign_id) REFERENCES "${schema}".campaigns(id) 
            ON DELETE NO ACTION ON UPDATE NO ACTION;
          END IF;
        END $$;
      `);

      await queryRunner.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'FK_${schema}_ad_variations_creative'
          ) THEN
            ALTER TABLE "${schema}".ad_variations 
            ADD CONSTRAINT "FK_${schema}_ad_variations_creative" 
            FOREIGN KEY (creative_id) REFERENCES "${schema}".creatives(id) 
            ON DELETE NO ACTION ON UPDATE NO ACTION;
          END IF;
        END $$;
      `);

      await queryRunner.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'FK_${schema}_creatives_owner'
          ) THEN
            ALTER TABLE "${schema}".creatives 
            ADD CONSTRAINT "FK_${schema}_creatives_owner" 
            FOREIGN KEY (owner_id) REFERENCES "${schema}".users(id) 
            ON DELETE NO ACTION ON UPDATE NO ACTION;
          END IF;
        END $$;
      `);
    },
    down: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      // Drop foreign key constraints first
      await queryRunner.query(`
        ALTER TABLE IF EXISTS "${schema}".creatives 
        DROP CONSTRAINT IF EXISTS "FK_${schema}_creatives_owner"
      `);

      await queryRunner.query(`
        ALTER TABLE IF EXISTS "${schema}".ad_variations 
        DROP CONSTRAINT IF EXISTS "FK_${schema}_ad_variations_creative"
      `);

      await queryRunner.query(`
        ALTER TABLE IF EXISTS "${schema}".ad_variations 
        DROP CONSTRAINT IF EXISTS "FK_${schema}_ad_variations_campaign"
      `);

      await queryRunner.query(`
        ALTER TABLE IF EXISTS "${schema}".ad_variations 
        DROP CONSTRAINT IF EXISTS "FK_${schema}_ad_variations_owner"
      `);

      await queryRunner.query(`
        ALTER TABLE IF EXISTS "${schema}".audiences 
        DROP CONSTRAINT IF EXISTS "FK_${schema}_audiences_variation"
      `);

      await queryRunner.query(`
        ALTER TABLE IF EXISTS "${schema}".audiences 
        DROP CONSTRAINT IF EXISTS "FK_${schema}_audiences_owner"
      `);

      await queryRunner.query(`
        ALTER TABLE IF EXISTS "${schema}".campaigns 
        DROP CONSTRAINT IF EXISTS "FK_${schema}_campaigns_owner"
      `);

      await queryRunner.query(`
        ALTER TABLE IF EXISTS "${schema}".storyboards 
        DROP CONSTRAINT IF EXISTS "FK_${schema}_storyboards_owner"
      `);

      await queryRunner.query(`
        ALTER TABLE IF EXISTS "${schema}".templates 
        DROP CONSTRAINT IF EXISTS "FK_${schema}_templates_owner"
      `);

      await queryRunner.query(`
        ALTER TABLE IF EXISTS "${schema}".invitations 
        DROP CONSTRAINT IF EXISTS "FK_${schema}_invitations_role"
      `);

      await queryRunner.query(`
        ALTER TABLE IF EXISTS "${schema}".invitations 
        DROP CONSTRAINT IF EXISTS "FK_${schema}_invitations_invitor"
      `);

      await queryRunner.query(`
        ALTER TABLE IF EXISTS "${schema}".users_roles_roles 
        DROP CONSTRAINT IF EXISTS "FK_${schema}_users_roles_role"
      `);

      await queryRunner.query(`
        ALTER TABLE IF EXISTS "${schema}".users_roles_roles 
        DROP CONSTRAINT IF EXISTS "FK_${schema}_users_roles_user"
      `);

      // Drop indexes
      await queryRunner.query(
        `DROP INDEX IF EXISTS "${schema}"."IDX_${schema}_users_roles_role"`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS "${schema}"."IDX_${schema}_users_roles_user"`,
      );

      // Drop tables
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}".creatives`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}".ad_variations`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}".audiences`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}".campaigns`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}".storyboards`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}".templates`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}".invitations`);
      await queryRunner.query(
        `DROP TABLE IF EXISTS "${schema}".users_roles_roles`,
      );
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}".users`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}".roles`);

      // Drop enums
      await queryRunner.query(
        `DROP TYPE IF EXISTS "${schema}".ad_variations_bidding_strategy_enum`,
      );
      await queryRunner.query(
        `DROP TYPE IF EXISTS "${schema}".audiences_type_enum`,
      );
      await queryRunner.query(
        `DROP TYPE IF EXISTS "${schema}".campaigns_status_enum`,
      );
      await queryRunner.query(
        `DROP TYPE IF EXISTS "${schema}".campaigns_budget_type_enum`,
      );
      await queryRunner.query(
        `DROP TYPE IF EXISTS "${schema}".campaigns_goal_enum`,
      );
      await queryRunner.query(
        `DROP TYPE IF EXISTS "${schema}".invitations_status_enum`,
      );
      await queryRunner.query(
        `DROP TYPE IF EXISTS "${schema}".invitations_type_enum`,
      );
    },
  },
  {
    version: 1764930787227,
    name: 'AddImageHistoryToStoryBoard',
    up: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      await queryRunner.query(
        `ALTER TABLE "${schema}"."storyboards" ADD "imageHistory" text array`,
      );
    },
    down: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      await queryRunner.query(
        `ALTER TABLE "${schema}"."storyboards" DROP COLUMN "imageHistory"`,
      );
    },
  },
  {
    version: 1764959435632,
    name: 'AddCampaignDtoFields',
    up: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      await queryRunner.query(
        `ALTER TABLE "${schema}"."campaigns" ADD "selected_days" jsonb`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}"."campaigns" ADD "audience" jsonb`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}"."campaigns" ADD "selected_broadcast_tv" text array`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}"."campaigns" ADD "selected_streaming" text array`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}"."campaigns" ADD "bidding_strategy" character varying(100)`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}"."campaigns" ADD "creative_data" jsonb`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}"."campaigns" ADD "impressions" integer NOT NULL DEFAULT '0'`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}"."campaigns" ADD "reach" integer NOT NULL DEFAULT '0'`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}"."campaigns" ADD "spend" numeric(10,2) NOT NULL DEFAULT '0'`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}"."campaigns" ADD "roi" character varying(50)`,
      );
    },
    down: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      await queryRunner.query(
        `ALTER TABLE "${schema}"."campaigns" DROP COLUMN "roi"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}"."campaigns" DROP COLUMN "spend"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}"."campaigns" DROP COLUMN "reach"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}"."campaigns" DROP COLUMN "impressions"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}"."campaigns" DROP COLUMN "creative_data"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}"."campaigns" DROP COLUMN "bidding_strategy"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}"."campaigns" DROP COLUMN "selected_streaming"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}"."campaigns" DROP COLUMN "selected_broadcast_tv"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}"."campaigns" DROP COLUMN "audience"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}"."campaigns" DROP COLUMN "selected_days"`,
      );
    },
  },
  {
    version: 1733999000000,
    name: 'AddTasksAndTaskTemplates',
    up: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      // Ensure uuid-ossp extension is available
      await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

      // Create task status enum
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE "${schema}"."task_status_enum" AS ENUM ('To Do', 'In Progress', 'Completed');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Create priority enum
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE "${schema}"."priority_enum" AS ENUM ('Low', 'Medium', 'High');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Create task type enum
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE "${schema}"."task_type_enum" AS ENUM ('Campaign', 'Creative');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Create tasks table
      await queryRunner.query(`
        CREATE TABLE "${schema}"."tasks" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMP,
          "organization_id" uuid NOT NULL,
          "name" character varying(255) NOT NULL,
          "description" text NOT NULL,
          "related_campaign_id" uuid,
          "related_creative_id" uuid,
          "assigned_user_id" uuid,
          "status" "${schema}"."task_status_enum" NOT NULL DEFAULT 'To Do',
          "priority" "${schema}"."priority_enum" NOT NULL DEFAULT 'Medium',
          "due_date" date NOT NULL,
          "last_updated" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_tasks_id" PRIMARY KEY ("id")
        )
      `);

      // Create task_templates table
      await queryRunner.query(`
        CREATE TABLE "${schema}"."task_templates" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMP,
          "organization_id" uuid NOT NULL,
          "name" character varying(255) NOT NULL,
          "task_type" "${schema}"."task_type_enum" NOT NULL,
          "tasks" jsonb NOT NULL,
          CONSTRAINT "PK_task_templates_id" PRIMARY KEY ("id")
        )
      `);

      // Create indexes
      await queryRunner.query(`
        CREATE INDEX "IDX_tasks_organization_id" ON "${schema}"."tasks" ("organization_id")
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_tasks_assigned_user_id" ON "${schema}"."tasks" ("assigned_user_id")
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_tasks_related_campaign_id" ON "${schema}"."tasks" ("related_campaign_id")
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_tasks_related_creative_id" ON "${schema}"."tasks" ("related_creative_id")
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_tasks_status" ON "${schema}"."tasks" ("status")
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_tasks_due_date" ON "${schema}"."tasks" ("due_date")
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_task_templates_organization_id" ON "${schema}"."task_templates" ("organization_id")
      `);

      // Add foreign key constraints
      await queryRunner.query(`
        ALTER TABLE "${schema}"."tasks"
        ADD CONSTRAINT "FK_tasks_campaign"
        FOREIGN KEY ("related_campaign_id")
        REFERENCES "${schema}"."campaigns"("id")
        ON DELETE SET NULL
      `);

      await queryRunner.query(`
        ALTER TABLE "${schema}"."tasks"
        ADD CONSTRAINT "FK_tasks_creative"
        FOREIGN KEY ("related_creative_id")
        REFERENCES "${schema}"."creatives"("id")
        ON DELETE SET NULL
      `);

      await queryRunner.query(`
        ALTER TABLE "${schema}"."tasks"
        ADD CONSTRAINT "FK_tasks_user"
        FOREIGN KEY ("assigned_user_id")
        REFERENCES "${schema}"."users"("id")
        ON DELETE SET NULL
      `);
    },
    down: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      // Drop foreign key constraints
      await queryRunner.query(
        `ALTER TABLE "${schema}"."tasks" DROP CONSTRAINT "FK_tasks_user"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}"."tasks" DROP CONSTRAINT "FK_tasks_creative"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${schema}"."tasks" DROP CONSTRAINT "FK_tasks_campaign"`,
      );

      // Drop indexes
      await queryRunner.query(
        `DROP INDEX "${schema}"."IDX_task_templates_organization_id"`,
      );
      await queryRunner.query(
        `DROP INDEX "${schema}"."IDX_tasks_due_date"`,
      );
      await queryRunner.query(`DROP INDEX "${schema}"."IDX_tasks_status"`);
      await queryRunner.query(
        `DROP INDEX "${schema}"."IDX_tasks_related_creative_id"`,
      );
      await queryRunner.query(
        `DROP INDEX "${schema}"."IDX_tasks_related_campaign_id"`,
      );
      await queryRunner.query(
        `DROP INDEX "${schema}"."IDX_tasks_assigned_user_id"`,
      );
      await queryRunner.query(
        `DROP INDEX "${schema}"."IDX_tasks_organization_id"`,
      );

      // Drop tables
      await queryRunner.query(`DROP TABLE "${schema}"."task_templates"`);
      await queryRunner.query(`DROP TABLE "${schema}"."tasks"`);

      // Drop enums
      await queryRunner.query(`DROP TYPE "${schema}"."task_type_enum"`);
      await queryRunner.query(`DROP TYPE "${schema}"."priority_enum"`);
      await queryRunner.query(`DROP TYPE "${schema}"."task_status_enum"`);
    },
  },
  {
    version: 1765400000000,
    name: 'MakeTaskFieldsOptional',
    up: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      // Make description nullable with default empty string
      await queryRunner.query(`
        ALTER TABLE "${schema}"."tasks" 
        ALTER COLUMN "description" DROP NOT NULL,
        ALTER COLUMN "description" SET DEFAULT ''
      `);

      // Make due_date nullable
      await queryRunner.query(`
        ALTER TABLE "${schema}"."tasks" 
        ALTER COLUMN "due_date" DROP NOT NULL
      `);
    },
    down: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      // Revert due_date to NOT NULL (set a default date first for existing nulls)
      await queryRunner.query(`
        UPDATE "${schema}"."tasks" 
        SET "due_date" = CURRENT_DATE + INTERVAL '7 days'
        WHERE "due_date" IS NULL
      `);
      await queryRunner.query(`
        ALTER TABLE "${schema}"."tasks" 
        ALTER COLUMN "due_date" SET NOT NULL
      `);

      // Revert description to NOT NULL (set empty string for existing nulls)
      await queryRunner.query(`
        UPDATE "${schema}"."tasks" 
        SET "description" = ''
        WHERE "description" IS NULL
      `);
      await queryRunner.query(`
        ALTER TABLE "${schema}"."tasks" 
        ALTER COLUMN "description" SET NOT NULL,
        ALTER COLUMN "description" DROP DEFAULT
      `);
    },
  },
];
