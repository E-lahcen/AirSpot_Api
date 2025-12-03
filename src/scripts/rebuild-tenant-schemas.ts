import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TenantMigrationService } from '../modules/tenant/services/tenant-migration.service';

/**
 * CLI script to rebuild all tenant schemas (WARNING: DELETES ALL DATA)
 * Usage: npm run tenant:rebuild
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const tenantMigrationService = app.get(TenantMigrationService);

  console.log(
    '⚠️  WARNING: This will DELETE ALL DATA in all tenant schemas!\n',
  );
  console.log('Press Ctrl+C to cancel...\n');

  // Wait 5 seconds to give user a chance to cancel
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log('🚀 Starting tenant schema rebuild...\n');

  try {
    await tenantMigrationService.rebuildAllTenantSchemas();
    console.log('\n✓ All tenant schemas rebuilt successfully!');
  } catch (error) {
    console.error('❌ Error rebuilding tenant schemas:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
