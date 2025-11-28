# Tenant Migration Sync Script

## Overview

This script helps keep tenant schema migrations synchronized with TypeORM public schema migrations. It automatically analyzes new TypeORM migrations and generates tenant migration entries that you can review and add to `tenant-schema-migrations.ts`.

**✨ Automated Git Hook**: This check runs automatically when you commit migration files, preventing unsynced migrations from being committed.

## Usage

### Basic Command

```bash
npm run tenant:sync
```

This will:

1. Scan all TypeORM migrations in `src/migrations/`
2. Compare with existing tenant migrations in `tenant-schema-migrations.ts`
3. Detect new migrations that haven't been synced
4. Generate tenant migration code for you to review

### Workflow

#### 1. Create a New Migration

```bash
# Generate migration after entity changes
npm run migration:generate your-migration-name

# Example
npm run migration:generate add-phone-number-to-users
```

This creates a file like: `src/migrations/1234567890000-add-phone-number-to-users.ts`

#### 2. Run the Sync Script

```bash
npm run tenant:sync
```

Output example:

```
🔄 Syncing tenant migrations with TypeORM migrations...

Found 6 migration files

✓ Parsed: 1732233600000-InitialSchema.ts
✓ Parsed: 1234567890000-add-phone-number-to-users.ts

📝 Found 1 new migrations to add:

   - AddPhoneNumberToUsers (1234567890000)

📄 Generated tenant migration entries:

---

  {
    version: 1234567890000,
    name: 'AddPhoneNumberToUsers',
    up: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      await queryRunner.query(`ALTER TABLE "${schema}"."users" ADD "phone_number" character varying(20)`);
    },
    down: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      await queryRunner.query(`ALTER TABLE "${schema}"."users" DROP COLUMN "phone_number"`);
    },
  }

---

⚠️  Please manually review and add these entries to tenant-schema-migrations.ts
   Some queries may need manual adjustment for tenant-specific logic.
```

#### 3. Review and Add to tenant-schema-migrations.ts

1. Open `src/migrations/tenant-schema-migrations.ts`
2. Find the `TENANT_MIGRATIONS` array
3. Add the generated entry to the array (in chronological order by version)
4. Review the queries - adjust if needed for tenant-specific logic
5. Save the file

Example:

```typescript
export const TENANT_MIGRATIONS: TenantMigration[] = [
  {
    version: 1732233600000,
    name: 'InitialSchema',
    up: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      // ... existing migration
    },
    down: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      // ... existing migration
    },
  },
  // ✨ Add your new migration here
  {
    version: 1234567890000,
    name: 'AddPhoneNumberToUsers',
    up: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      await queryRunner.query(
        `ALTER TABLE "${schema}"."users" ADD "phone_number" character varying(20)`,
      );
    },
    down: async (queryRunner: QueryRunner, schema: string): Promise<void> => {
      await queryRunner.query(
        `ALTER TABLE "${schema}"."users" DROP COLUMN "phone_number"`,
      );
    },
  },
];
```

#### 4. Run Migrations

```bash
# Run public schema migrations
npm run migration:run

# Run tenant schema migrations across all tenants
npm run tenant:migrate
```

## Automated Git Hook Protection

### What It Does

When you try to commit migration files, the script automatically runs in check mode to verify all migrations are synced. If unsynced migrations are detected, **the commit will be blocked**.

### Example: Blocked Commit

```bash
git add src/migrations/1234567890000-add-phone-number-to-users.ts
git commit -m "feat: add phone number to users"

# Output:
🔄 Syncing tenant migrations with TypeORM migrations...

Found 6 migration files

✓ Parsed: 1732233600000-InitialSchema.ts
✓ Parsed: 1234567890000-add-phone-number-to-users.ts

📝 Found 1 new migrations to add:

   - AddPhoneNumberToUsers (1234567890000)

❌ Commit blocked: Unsynced tenant migrations detected!
   Run: npm run tenant:sync to see details, then update tenant-schema-migrations.ts

husky - pre-commit hook exited with code 1 (error)
```

### How to Fix

1. Run `npm run tenant:sync` to see generated code
2. Add the generated migration to `tenant-schema-migrations.ts`
3. Commit both files together:

```bash
git add src/migrations/1234567890000-add-phone-number-to-users.ts
git add src/migrations/tenant-schema-migrations.ts
git commit -m "feat: add phone number to users"
# ✅ Commit succeeds!
```

### Bypassing (Not Recommended)

If you absolutely must commit without syncing (not recommended):

```bash
git commit --no-verify -m "your message"
```

⚠️ **Warning**: This bypasses all pre-commit checks. Only use in emergencies.

## How It Works

### Query Adaptation

The script automatically adapts public schema queries to tenant schema queries:

**Public Schema:**

```sql
ALTER TABLE "users" ADD "phone_number" varchar(20)
```

**Tenant Schema (Generated):**

```sql
ALTER TABLE "${schema}"."users" ADD "phone_number" varchar(20)
```

### Filtering

The script automatically filters out public-schema-only tables:

- `tenants` (tenant registry)
- `users` (reference in public schema)
- `roles` (reference in public schema)
- `invitations` (reference in public schema)

These tables exist in the public schema for shared data, so their migrations aren't applied to tenant schemas.

### Manual Review Required

⚠️ **Always review generated migrations before adding them!**

Some scenarios require manual adjustment:

- Complex queries with subqueries
- Queries that reference multiple schemas
- Tenant-specific business logic
- Data migrations (not just schema changes)
- Conditional logic based on tenant

## Tips

### Automatic Protection

The git hook runs automatically when you commit migration files. You don't need to remember to run the sync check manually!

**What triggers the check:**

- Any file matching `src/migrations/[0-9]*.ts` (migration files)
- Happens during `git commit`
- Runs before ESLint and Prettier

**What doesn't trigger:**

- Committing `tenant-schema-migrations.ts` alone
- Non-migration TypeScript files
- Other file types

### Check If Synced

Run `npm run tenant:sync` anytime to check if all migrations are synced:

```bash
npm run tenant:sync
# Output: ✅ All migrations are already synced!
```

### After Pulling Changes

If a teammate added migrations:

```bash
git pull
npm run tenant:sync  # Check what needs syncing
# Review and add any new entries
npm run tenant:migrate  # Apply to all tenants
```

### Avoiding Mistakes

1. **Never skip public migrations** - Run both public and tenant migrations
2. **Test on development first** - Always test tenant migrations before production
3. **Version control** - Commit both TypeORM and tenant migrations together
4. **Document changes** - Add comments for complex tenant-specific logic

## Troubleshooting

### "No migrations to sync" but I just added one

- Make sure your migration file follows the naming pattern: `[timestamp]-[name].ts`
- Verify the file is in `src/migrations/`
- Check that it's not `tenant-schema-migrations.ts` itself

### Generated query looks wrong

The script does basic adaptation. For complex queries:

1. Start with the generated code
2. Manually adjust for your specific use case
3. Test thoroughly in development

### Migration failed on tenants

If `npm run tenant:migrate` fails:

1. Check the error message for which tenant failed
2. Review the migration SQL in `tenant-schema-migrations.ts`
3. Fix the SQL and try again
4. Use `npm run tenant:rebuild` as last resort (⚠️ DESTROYS DATA)

## Related Commands

```bash
# Generate new TypeORM migration
npm run migration:generate name

# Run public schema migrations
npm run migration:run

# Revert last public migration
npm run migration:revert

# Check migration status
npm run migration:show

# Sync tenant migrations (this script)
npm run tenant:sync

# Run tenant migrations
npm run tenant:migrate

# Rebuild all tenant schemas (⚠️ DESTRUCTIVE)
npm run tenant:rebuild
```

## See Also

- [Multi-Tenant Migrations Guide](../MULTI_TENANT_MIGRATIONS.md)
- [Architecture Documentation](../ARCHITECTURE.md)
- [Migration Workflows](../src/migrations/README.md)
