import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserTenantEntityUpdated1764415176775
  implements MigrationInterface
{
  name = 'UserTenantEntityUpdated1764415176775';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_tenant" DROP CONSTRAINT "UQ_225891cc5883f1c35aa9091642c"`,
    );
    await queryRunner.query(`ALTER TABLE "user_tenant" DROP COLUMN "slug"`);
    await queryRunner.query(`ALTER TABLE "user_tenant" DROP COLUMN "email"`);
    await queryRunner.query(
      `ALTER TABLE "user_tenant" ADD "email" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_tenant" ADD CONSTRAINT "UQ_225891cc5883f1c35aa9091642c" UNIQUE ("user_id", "tenant_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_tenant" ADD CONSTRAINT "FK_2393aeb9c992e95d200b13528b5" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_tenant" DROP CONSTRAINT "FK_2393aeb9c992e95d200b13528b5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_tenant" DROP CONSTRAINT "UQ_225891cc5883f1c35aa9091642c"`,
    );
    await queryRunner.query(`ALTER TABLE "user_tenant" DROP COLUMN "email"`);
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
}
