import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationMetadataToTenants1764243000000
  implements MigrationInterface
{
  name = 'AddOrganizationMetadataToTenants1764243000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tenants" ADD "description" text`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "logo" text`);
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "region" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "default_role" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "enforce_domain" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "domain" character varying(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "domain"`);
    await queryRunner.query(
      `ALTER TABLE "tenants" DROP COLUMN "enforce_domain"`,
    );
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "default_role"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "region"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "logo"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "description"`);
  }
}
