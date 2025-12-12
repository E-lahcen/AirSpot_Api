/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function createTasksTables() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const schemas = ['tenant_acme_corporation', 'tenant_acme_corporation_lahcen'];

  for (const schema of schemas) {
    console.log(`\n🔧 Creating tasks tables in: ${schema}\n`);

    try {
      // Drop existing tables if they exist (to start fresh)
      console.log('  Dropping existing tables (if any)...');
      await dataSource.query(
        `DROP TABLE IF EXISTS "${schema}"."tasks" CASCADE`,
      );
      await dataSource.query(
        `DROP TABLE IF EXISTS "${schema}"."task_templates" CASCADE`,
      );
      await dataSource.query(
        `DROP TYPE IF EXISTS "${schema}"."task_status_enum" CASCADE`,
      );
      await dataSource.query(
        `DROP TYPE IF EXISTS "${schema}"."priority_enum" CASCADE`,
      );
      await dataSource.query(
        `DROP TYPE IF EXISTS "${schema}"."task_type_enum" CASCADE`,
      );
      console.log('  ✓ Cleaned up existing objects\n');

      // Create enums
      console.log('  Creating enums...');
      await dataSource.query(
        `CREATE TYPE "${schema}"."task_status_enum" AS ENUM ('To Do', 'In Progress', 'Completed')`,
      );
      await dataSource.query(
        `CREATE TYPE "${schema}"."priority_enum" AS ENUM ('Low', 'Medium', 'High')`,
      );
      await dataSource.query(
        `CREATE TYPE "${schema}"."task_type_enum" AS ENUM ('Campaign', 'Creative')`,
      );
      console.log('  ✓ Created enums\n');

      // Create tasks table
      console.log('  Creating tasks table...');
      await dataSource.query(`
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
          "assigned_user_id" uuid NOT NULL,
          "status" "${schema}"."task_status_enum" NOT NULL DEFAULT 'To Do',
          "priority" "${schema}"."priority_enum" NOT NULL DEFAULT 'Medium',
          "due_date" date NOT NULL,
          CONSTRAINT "PK_tasks_${schema}_id" PRIMARY KEY ("id")
        )
      `);
      console.log('  ✓ Created tasks table\n');

      // Create task_templates table
      console.log('  Creating task_templates table...');
      await dataSource.query(`
        CREATE TABLE "${schema}"."task_templates" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMP,
          "organization_id" uuid NOT NULL,
          "name" character varying(255) NOT NULL,
          "task_type" "${schema}"."task_type_enum" NOT NULL,
          "tasks" jsonb NOT NULL,
          CONSTRAINT "PK_task_templates_${schema}_id" PRIMARY KEY ("id")
        )
      `);
      console.log('  ✓ Created task_templates table\n');

      // Create indexes
      console.log('  Creating indexes...');
      await dataSource.query(
        `CREATE INDEX "IDX_${schema}_tasks_organization_id" ON "${schema}"."tasks" ("organization_id")`,
      );
      await dataSource.query(
        `CREATE INDEX "IDX_${schema}_tasks_assigned_user_id" ON "${schema}"."tasks" ("assigned_user_id")`,
      );
      await dataSource.query(
        `CREATE INDEX "IDX_${schema}_tasks_related_campaign_id" ON "${schema}"."tasks" ("related_campaign_id")`,
      );
      await dataSource.query(
        `CREATE INDEX "IDX_${schema}_tasks_related_creative_id" ON "${schema}"."tasks" ("related_creative_id")`,
      );
      await dataSource.query(
        `CREATE INDEX "IDX_${schema}_tasks_status" ON "${schema}"."tasks" ("status")`,
      );
      await dataSource.query(
        `CREATE INDEX "IDX_${schema}_tasks_due_date" ON "${schema}"."tasks" ("due_date")`,
      );
      await dataSource.query(
        `CREATE INDEX "IDX_${schema}_task_templates_organization_id" ON "${schema}"."task_templates" ("organization_id")`,
      );
      console.log('  ✓ Created indexes\n');

      // Add foreign keys
      console.log('  Creating foreign key constraints...');
      await dataSource.query(`
        ALTER TABLE "${schema}"."tasks"
        ADD CONSTRAINT "FK_${schema}_tasks_campaign"
        FOREIGN KEY ("related_campaign_id")
        REFERENCES "${schema}"."campaigns"("id")
        ON DELETE SET NULL
      `);

      await dataSource.query(`
        ALTER TABLE "${schema}"."tasks"
        ADD CONSTRAINT "FK_${schema}_tasks_creative"
        FOREIGN KEY ("related_creative_id")
        REFERENCES "${schema}"."creatives"("id")
        ON DELETE SET NULL
      `);

      await dataSource.query(`
        ALTER TABLE "${schema}"."tasks"
        ADD CONSTRAINT "FK_${schema}_tasks_user"
        FOREIGN KEY ("assigned_user_id")
        REFERENCES "${schema}"."users"("id")
        ON DELETE CASCADE
      `);
      console.log('  ✓ Created foreign key constraints\n');

      // Verify
      const tasksExists = await dataSource.query(
        `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'tasks')`,
        [schema],
      );
      const templatesExists = await dataSource.query(
        `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'task_templates')`,
        [schema],
      );

      console.log(`✅ Verification for ${schema}:`);
      console.log(`   Tasks table: ${tasksExists[0].exists ? '✓' : '✗'}`);
      console.log(
        `   Task templates table: ${templatesExists[0].exists ? '✓' : '✗'}`,
      );
    } catch (error) {
      console.error(`❌ Error creating tables in ${schema}:`, error.message);
      throw error;
    }
  }

  console.log('\n✅ All tables created successfully!\n');
  await app.close();
}

createTasksTables().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
