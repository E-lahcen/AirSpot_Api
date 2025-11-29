import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserTenantEntity1764414355796 implements MigrationInterface {
  name = 'UserTenantEntity1764414355796';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the table if it doesn't exist
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_tenant" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "email" character varying NOT NULL,
        CONSTRAINT "PK_user_tenant_id" PRIMARY KEY ("id")
      )
    `);

    // Drop index if it exists
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_6e7205f2f240e1d73b327560bc"`,
    );

    // Drop constraint if it exists
    await queryRunner.query(
      `ALTER TABLE "user_tenant" DROP CONSTRAINT IF EXISTS "UQ_225891cc5883f1c35aa9091642c"`,
    );

    // Drop columns if they exist
    await queryRunner.query(
      `ALTER TABLE "user_tenant" DROP COLUMN IF EXISTS "email"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_tenant" DROP COLUMN IF EXISTS "slug"`,
    );

    // Add columns
    await queryRunner.query(
      `ALTER TABLE "user_tenant" ADD COLUMN IF NOT EXISTS "email" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_tenant" ADD COLUMN IF NOT EXISTS "slug" character varying NOT NULL`,
    );

    // Add unique constraint
    await queryRunner.query(
      `ALTER TABLE "user_tenant" ADD CONSTRAINT "UQ_225891cc5883f1c35aa9091642c" UNIQUE ("user_id", "tenant_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_tenant" DROP CONSTRAINT IF EXISTS "UQ_225891cc5883f1c35aa9091642c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_tenant" DROP COLUMN IF EXISTS "slug"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_tenant" DROP COLUMN IF EXISTS "email"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_tenant" ADD COLUMN IF NOT EXISTS "slug" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_tenant" ADD COLUMN IF NOT EXISTS "email" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_tenant" ADD CONSTRAINT "UQ_225891cc5883f1c35aa9091642c" UNIQUE ("user_id", "tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_6e7205f2f240e1d73b327560bc" ON "user_tenant" ("email")`,
    );
  }
}
