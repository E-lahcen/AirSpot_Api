import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveTenantOwnerFk1763916003624 implements MigrationInterface {
  name = 'RemoveTenantOwnerFk1763916003624';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenants" DROP CONSTRAINT "FK_efba90c155ec02ae586fb7ed31d"`,
    );
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "owner_id"`);
    await queryRunner.query(`ALTER TABLE "roles" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "owner_id" uuid`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "owner_id"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "owner_id" uuid`);
    await queryRunner.query(`ALTER TABLE "roles" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD CONSTRAINT "FK_efba90c155ec02ae586fb7ed31d" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
