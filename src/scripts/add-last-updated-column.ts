/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function addLastUpdatedColumn() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const schemas = ['tenant_acme_corporation', 'tenant_acme_corporation_lahcen'];

  for (const schema of schemas) {
    console.log(`\n🔧 Adding last_updated column to: ${schema}\n`);

    try {
      // Check if column already exists
      const columnExists = await dataSource.query(
        `SELECT EXISTS(
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = $1 AND table_name = 'tasks' AND column_name = 'last_updated'
        )`,
        [schema],
      );

      if (columnExists[0].exists) {
        console.log(`  ⚠️  Column already exists in ${schema}`);
        continue;
      }

      // Add the last_updated column
      await dataSource.query(`
        ALTER TABLE "${schema}"."tasks"
        ADD COLUMN "last_updated" TIMESTAMP NOT NULL DEFAULT now()
      `);

      console.log(`  ✅ Successfully added last_updated column to ${schema}`);
    } catch (error) {
      console.error(`  ❌ Error adding column to ${schema}:`, error.message);
      throw error;
    }
  }

  console.log('\n✅ All columns added successfully!\n');
  await app.close();
}

addLastUpdatedColumn().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
