import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOwnerIdToEntities1763919549258 implements MigrationInterface {
  name = 'AddOwnerIdToEntities1763919549258';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "owner_id"`);
    await queryRunner.query(`ALTER TABLE "roles" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "owner_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD "owner_id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "target_group_selections" ADD "owner_id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_variations" ADD "owner_id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "owner_id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD CONSTRAINT "FK_667fd3f5d437c26c052226e7e43" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "target_group_selections" ADD CONSTRAINT "FK_47de84f8d3da93b64be1c23fcf9" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_variations" ADD CONSTRAINT "FK_1982d69e0c861597cf1e47a773a" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD CONSTRAINT "FK_8fc1c0e62b2d5d19e27fb5f816a" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "creatives" DROP CONSTRAINT "FK_8fc1c0e62b2d5d19e27fb5f816a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_variations" DROP CONSTRAINT "FK_1982d69e0c861597cf1e47a773a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "target_group_selections" DROP CONSTRAINT "FK_47de84f8d3da93b64be1c23fcf9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP CONSTRAINT "FK_667fd3f5d437c26c052226e7e43"`,
    );
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "owner_id"`);
    await queryRunner.query(
      `ALTER TABLE "ad_variations" DROP COLUMN "owner_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "target_group_selections" DROP COLUMN "owner_id"`,
    );
    await queryRunner.query(`ALTER TABLE "campaigns" DROP COLUMN "owner_id"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "owner_id"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "owner_id" uuid`);
    await queryRunner.query(`ALTER TABLE "roles" ADD "deleted_at" TIMESTAMP`);
  }
}
