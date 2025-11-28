# Database Migrations

This project uses TypeORM migrations to manage database schema changes. Migrations provide a version-controlled way to evolve your database schema over time.

## Available Migration Commands

### Generate a New Migration

Automatically generates a migration by comparing your entities with the current database schema:

```bash
npm run migration:generate -- src/migrations/MigrationName
```

Example:

```bash
npm run migration:generate -- src/migrations/AddUserPhoneNumber
```

### Create an Empty Migration

Creates an empty migration file that you can manually edit:

```bash
npm run migration:create -- src/migrations/MigrationName
```

Example:

```bash
npm run migration:create -- src/migrations/SeedInitialRoles
```

### Run Pending Migrations

Executes all pending migrations:

```bash
npm run migration:run
```

### Revert Last Migration

Reverts the most recently executed migration:

```bash
npm run migration:revert
```

### Show Migration Status

Displays the status of all migrations:

```bash
npm run migration:show
```

## Migration Workflow

### 1. Development Workflow

1. **Make changes to your entities** (e.g., add a new field to `User` entity)

2. **Build the project** to compile TypeScript:

   ```bash
   npm run build
   ```

3. **Generate the migration**:

   ```bash
   npm run migration:generate -- src/migrations/AddUserPhoneNumber
   ```

4. **Review the generated migration** in `src/migrations/` directory

5. **Run the migration**:
   ```bash
   npm run migration:run
   ```

### 2. Production Deployment

Migrations are automatically run when the application starts because `migrationsRun: true` is set in the TypeORM configuration.

Alternatively, you can run migrations manually before starting the application:

```bash
npm run migration:run
npm run start:prod
```

## Important Notes

### Synchronize is Disabled

The `synchronize: false` option is set in production to prevent automatic schema changes. This ensures:

- **Data Safety**: Prevents accidental data loss
- **Controlled Changes**: All schema changes go through migrations
- **Version Control**: Database changes are tracked in git
- **Rollback Support**: Ability to revert changes

### Multi-Tenant Considerations

This application uses a multi-tenant architecture with PostgreSQL schemas. Keep in mind:

1. **Public Schema Migrations**: The migrations in this directory apply to the `public` schema (tenants, roles, etc.)

2. **Tenant Schema Migrations**: Each tenant has its own schema. Currently, tenant schemas are synchronized automatically when a new tenant is created. Consider implementing tenant-specific migrations in the future.

3. **Testing**: Always test migrations in a development environment before production

## Migration File Structure

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrationName1234567890000 implements MigrationInterface {
  name = 'MigrationName1234567890000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Forward migration (apply changes)
    await queryRunner.query(`ALTER TABLE "users" ADD "phone" varchar(20)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse migration (rollback changes)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
  }
}
```

## Best Practices

1. **Review Generated Migrations**: Always review auto-generated migrations before running them

2. **Test Rollbacks**: Ensure `down()` method properly reverts the `up()` changes

3. **Atomic Changes**: Keep migrations focused on a single logical change

4. **Data Migrations**: For complex data transformations, create separate migrations

5. **No Entity Imports**: Avoid importing entities in migrations; use raw SQL queries

6. **Backup First**: Always backup your database before running migrations in production

## Troubleshooting

### Migration Already Exists Error

If you see "Migration already exists", check the `migrations` table in your database:

```sql
SELECT * FROM migrations;
```

### Reset Migrations (Development Only)

⚠️ **Warning**: This will drop all tables and data!

```bash
# Drop all tables
npm run typeorm -- schema:drop

# Run all migrations from scratch
npm run migration:run
```

### Manual Migration Tracking

If needed, you can manually insert/remove migration records:

```sql
-- Mark a migration as run
INSERT INTO migrations (timestamp, name) VALUES (1732233600000, 'InitialSchema1732233600000');

-- Remove a migration record
DELETE FROM migrations WHERE name = 'InitialSchema1732233600000';
```

## Configuration Files

- **Runtime Config**: `src/app.module.ts` - Used by NestJS application
- **CLI Config**: `src/config/data-source.ts` - Used by TypeORM CLI commands

Both configurations must be kept in sync to ensure consistency between development and runtime behavior.
