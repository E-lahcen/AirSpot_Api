import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserTenantEntity1764414355796 implements MigrationInterface {
  name = 'UserTenantEntity1764414355796';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6e7205f2f240e1d73b327560bc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_tenant" DROP CONSTRAINT "UQ_225891cc5883f1c35aa9091642c"`,
    );
    await queryRunner.query(`ALTER TABLE "user_tenant" DROP COLUMN "email"`);
    await queryRunner.query(`ALTER TABLE "user_tenant" DROP COLUMN "slug"`);
    await queryRunner.query(
      `ALTER TABLE "user_tenant" ADD "email" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_tenant" ADD "slug" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_tenant" ADD CONSTRAINT "UQ_225891cc5883f1c35aa9091642c" UNIQUE ("user_id", "tenant_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_tenant" DROP CONSTRAINT "UQ_225891cc5883f1c35aa9091642c"`,
    );
    await queryRunner.query(`ALTER TABLE "user_tenant" DROP COLUMN "slug"`);
    await queryRunner.query(`ALTER TABLE "user_tenant" DROP COLUMN "email"`);
    await queryRunner.query(
      `ALTER TABLE "user_tenant" ADD "slug" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_tenant" ADD "email" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_tenant" ADD CONSTRAINT "UQ_225891cc5883f1c35aa9091642c" UNIQUE ("user_id", "tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6e7205f2f240e1d73b327560bc" ON "user_tenant" ("email") `,
    );
  }
}
