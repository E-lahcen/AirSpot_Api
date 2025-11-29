import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveOrganisationFromEntities1763917837527
  implements MigrationInterface
{
  name = 'RemoveOrganisationFromEntities1763917837527';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP CONSTRAINT "FK_b82fcefa3141cf82e4eb695b73c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "target_group_selections" DROP CONSTRAINT "FK_52800c20ac0d5fa761a7a5ed749"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_variations" DROP CONSTRAINT "FK_2c9755b39f7875337b6cc671f66"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" DROP CONSTRAINT "FK_a9257a40a0a87e9c53c9e4eac12"`,
    );
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "owner_id"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "roles" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "owner_id" uuid`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "owner_id"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "roles" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "owner_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD CONSTRAINT "FK_a9257a40a0a87e9c53c9e4eac12" FOREIGN KEY ("organization_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_variations" ADD CONSTRAINT "FK_2c9755b39f7875337b6cc671f66" FOREIGN KEY ("organization_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "target_group_selections" ADD CONSTRAINT "FK_52800c20ac0d5fa761a7a5ed749" FOREIGN KEY ("organization_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD CONSTRAINT "FK_b82fcefa3141cf82e4eb695b73c" FOREIGN KEY ("organization_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
