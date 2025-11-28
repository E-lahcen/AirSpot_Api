import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TenantMigrationService } from '../modules/tenant/services/tenant-migration.service';

/**
 * CLI script to run migrations on all tenant schemas
 * Usage: npm run tenant:migrate
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const tenantMigrationService = app.get(TenantMigrationService);

  console.log('🚀 Starting tenant schema migrations...\n');

  try {
    // Get current status
    const status = await tenantMigrationService.getMigrationStatus();

    console.log('Current tenant status:');
    console.table(
      status.map((s) => ({
        Tenant: s.slug,
        Active: s.isActive ? '✓' : '✗',
        'Schema Exists': s.schemaExists ? '✓' : '✗',
        'Tables Exist': s.tablesExist ? '✓' : '✗',
      })),
    );

    console.log('\n📦 Running migrations...\n');

    // Run migrations
    const results = await tenantMigrationService.runMigrationsForAllTenants();

    console.log('\n✅ Migration Results:');
    console.log(`  Success: ${results.success.length} tenant(s)`);
    if (results.success.length > 0) {
      console.log(`    - ${results.success.join(', ')}`);
    }

    if (results.failed.length > 0) {
      console.log(`\n❌ Failed: ${results.failed.length} tenant(s)`);
      console.log(`    - ${results.failed.join(', ')}`);
    }

    console.log('\n✓ Done!');
  } catch (error) {
    console.error('❌ Error running tenant migrations:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
