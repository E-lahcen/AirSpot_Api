/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function makeAssignedUserOptional() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);

  const tenantSchemas = [
    'tenant_acme_corporation',
    'tenant_acme_corporation_lahcen',
  ];

  for (const schema of tenantSchemas) {
    console.log(`\n🔧 Making assigned_user_id nullable in: ${schema}\n`);

    try {
      // Check if column exists
      const columnExists = await dataSource.query(
        `SELECT EXISTS(
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = 'tasks' AND column_name = 'assigned_user_id'
        )`,
        [schema],
      );

      if (!columnExists[0].exists) {
        console.log(
          `  ⚠️  Column assigned_user_id does not exist in ${schema}`,
        );
        continue;
      }

      // Make the column nullable
      await dataSource.query(`
        ALTER TABLE "${schema}"."tasks"
        ALTER COLUMN "assigned_user_id" DROP NOT NULL
      `);

      console.log(
        `  ✅ Successfully made assigned_user_id nullable in ${schema}\n`,
      );
    } catch (error) {
      console.error(`  ❌ Error updating ${schema}:`, error.message);
    }
  }

  console.log('✅ All columns updated successfully!');
  await app.close();
  process.exit(0);
}

makeAssignedUserOptional().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
