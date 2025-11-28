import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

interface MigrationInfo {
  version: number;
  name: string;
  fileName: string;
  upQueries: string[];
  downQueries: string[];
}

/**
 * Parse a TypeORM migration file to extract queries
 */
function parseMigrationFile(filePath: string): MigrationInfo | null {
  const content = readFileSync(filePath, 'utf-8');
  const fileName = filePath.split('/').pop() || '';

  // Extract version and name from filename (e.g., 1763919549258-add-owner-id-to-entities.ts)
  const match = fileName.match(/^(\d+)-(.+)\.ts$/);
  if (!match) return null;

  const [, versionStr, kebabName] = match;
  const version = parseInt(versionStr, 10);

  // Convert kebab-case to PascalCase
  const name = kebabName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  // Extract queries from up() method
  const upQueries: string[] = [];
  const upMatch = content.match(
    /public async up\(queryRunner: QueryRunner\): Promise<void> \{([\s\S]*?)\n {2}\}/,
  );
  if (upMatch) {
    const upContent = upMatch[1];
    const queryMatches = upContent.matchAll(
      /await queryRunner\.query\(`([^`]+)`\)/g,
    );
    for (const queryMatch of queryMatches) {
      upQueries.push(queryMatch[1].trim());
    }
  }

  // Extract queries from down() method
  const downQueries: string[] = [];
  const downMatch = content.match(
    /public async down\(queryRunner: QueryRunner\): Promise<void> \{([\s\S]*?)\n {2}\}/,
  );
  if (downMatch) {
    const downContent = downMatch[1];
    const queryMatches = downContent.matchAll(
      /await queryRunner\.query\(`([^`]+)`\)/g,
    );
    for (const queryMatch of queryMatches) {
      downQueries.push(queryMatch[1].trim());
    }
  }

  return {
    version,
    name,
    fileName,
    upQueries,
    downQueries,
  };
}

/**
 * Get all migration files from the migrations directory
 */
function getMigrationFiles(): string[] {
  const migrationsDir = join(process.cwd(), 'src', 'migrations');
  const files = readdirSync(migrationsDir);

  return files
    .filter(
      (file) =>
        /^\d+-.*\.ts$/.test(file) && file !== 'tenant-schema-migrations.ts',
    )
    .map((file) => join(migrationsDir, file))
    .sort();
}

/**
 * Adapt public schema query to tenant schema
 */
function adaptQueryToTenantSchema(query: string): string {
  // Replace table references to use schema prefix
  // This is a simplified approach - may need refinement for complex queries

  // Skip queries that already have schema references or are global
  if (query.includes('"${schema}".') || query.includes('CREATE EXTENSION')) {
    return query;
  }

  // Handle ALTER TABLE statements
  if (query.startsWith('ALTER TABLE "')) {
    return query.replace(
      /ALTER TABLE "([^"]+)"/,
      'ALTER TABLE "${schema}"."$1"',
    );
  }

  // Handle CREATE TABLE statements
  if (query.startsWith('CREATE TABLE "')) {
    return query.replace(
      /CREATE TABLE "([^"]+)"/,
      'CREATE TABLE "${schema}"."$1"',
    );
  }

  // Handle FOREIGN KEY REFERENCES
  if (query.includes('REFERENCES "')) {
    query = query.replace(
      /REFERENCES "([^"]+)"\("([^"]+)"\)/g,
      'REFERENCES "${schema}"."$1"("$2")',
    );
  }

  // Handle constraint names to include schema
  query = query.replace(/CONSTRAINT "([^"]+)"/g, 'CONSTRAINT "$1_${schema}"');

  return query;
}

/**
 * Generate tenant migration entry from TypeORM migration
 */
function generateTenantMigrationEntry(migration: MigrationInfo): string {
  const upQueries = migration.upQueries
    .map((q) => adaptQueryToTenantSchema(q))
    .filter((q) => {
      // Skip public schema specific operations
      return (
        !q.includes('ALTER TABLE "tenants"') &&
        !q.includes('ALTER TABLE "users"') &&
        !q.includes('ALTER TABLE "roles"') &&
        !q.includes('ALTER TABLE "invitations"')
      );
    });

  const downQueries = migration.downQueries
    .map((q) => adaptQueryToTenantSchema(q))
    .filter((q) => {
      return (
        !q.includes('ALTER TABLE "tenants"') &&
        !q.includes('ALTER TABLE "users"') &&
        !q.includes('ALTER TABLE "roles"') &&
        !q.includes('ALTER TABLE "invitations"')
      );
    });

  if (upQueries.length === 0) {
    return `  {
    version: ${migration.version},
    name: '${migration.name}',
    up: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      // No tenant-specific changes needed for this migration
    },
    down: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      // No tenant-specific changes needed for this migration
    },
  }`;
  }

  const upQueriesCode = upQueries
    .map((q) => `      await queryRunner.query(\`${q}\`);`)
    .join('\n');

  const downQueriesCode = downQueries
    .map((q) => `      await queryRunner.query(\`${q}\`);`)
    .join('\n');

  return `  {
    version: ${migration.version},
    name: '${migration.name}',
    up: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
${upQueriesCode}
    },
    down: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
${downQueriesCode}
    },
  }`;
}

/**
 * Main function to sync migrations
 */
async function syncTenantMigrations() {
  console.log('🔄 Syncing tenant migrations with TypeORM migrations...\n');

  // Get all migration files
  const migrationFiles = getMigrationFiles();
  console.log(`Found ${migrationFiles.length} migration files\n`);

  // Parse migrations
  const migrations: MigrationInfo[] = [];
  for (const filePath of migrationFiles) {
    const migration = parseMigrationFile(filePath);
    if (migration) {
      migrations.push(migration);
      console.log(`✓ Parsed: ${migration.fileName}`);
    }
  }

  // Read current tenant-schema-migrations.ts
  const tenantMigrationsPath = join(
    process.cwd(),
    'src',
    'migrations',
    'tenant-schema-migrations.ts',
  );
  const currentContent = readFileSync(tenantMigrationsPath, 'utf-8');

  // Extract existing versions
  const existingVersions = new Set<number>();
  const versionMatches = currentContent.matchAll(/version: (\d+),/g);
  for (const match of versionMatches) {
    existingVersions.add(parseInt(match[1], 10));
  }

  // Find new migrations that need to be added
  const newMigrations = migrations.filter(
    (m) => !existingVersions.has(m.version),
  );

  if (newMigrations.length === 0) {
    console.log('\n✅ All migrations are already synced!');
    return true;
  }

  console.log(`\n📝 Found ${newMigrations.length} new migrations to add:\n`);
  for (const migration of newMigrations) {
    console.log(`   - ${migration.name} (${migration.version})`);
  }

  console.log('\n📄 Generated tenant migration entries:\n');
  console.log('---\n');

  for (const migration of newMigrations) {
    const entry = generateTenantMigrationEntry(migration);
    console.log(entry);
    console.log('\n---\n');
  }

  console.log(
    '⚠️  Please manually review and add these entries to tenant-schema-migrations.ts',
  );
  console.log(
    '   Some queries may need manual adjustment for tenant-specific logic.',
  );
  console.log('\n❌ Commit blocked: Unsynced tenant migrations detected!');
  console.log(
    '   Run: npm run tenant:sync to see details, then update tenant-schema-migrations.ts',
  );

  await Promise.resolve();
  return false;
}

// Check if running in CI mode (for lint-staged)
const isCheckMode = process.argv.includes('--check');

// Run the sync
syncTenantMigrations()
  .then((success) => {
    if (isCheckMode && !success) {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Error syncing tenant migrations:', error);
    process.exit(1);
  });
