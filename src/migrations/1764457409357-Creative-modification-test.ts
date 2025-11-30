import { MigrationInterface, QueryRunner } from "typeorm";

export class CreativeModificationTest1764457409357 implements MigrationInterface {
    name = 'CreativeModificationTest1764457409357'

    public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove old storage columns, keep file_name
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN IF EXISTS "s3_key"`);
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN IF EXISTS "s3_bucket"`);
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN IF EXISTS "file_size"`);
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN IF EXISTS "mime_type"`);
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN IF EXISTS "duration"`);
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN IF EXISTS "thumbnail_s3_key"`);
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN IF EXISTS "end_duration"`);

    // Add new creative fields
    await queryRunner.query(`ALTER TABLE "creatives" ADD COLUMN IF NOT EXISTS "orientation" character varying(50)`);
    await queryRunner.query(`ALTER TABLE "creatives" ADD COLUMN IF NOT EXISTS "theme" character varying(50)`);
    await queryRunner.query(`ALTER TABLE "creatives" ADD COLUMN IF NOT EXISTS "video_position" character varying(50)`);
    await queryRunner.query(`ALTER TABLE "creatives" ADD COLUMN IF NOT EXISTS "brand_name" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "creatives" ADD COLUMN IF NOT EXISTS "price" character varying(50)`);
    await queryRunner.query(`ALTER TABLE "creatives" ADD COLUMN IF NOT EXISTS "product_name" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "creatives" ADD COLUMN IF NOT EXISTS "features" text array`);
    await queryRunner.query(`ALTER TABLE "creatives" ADD COLUMN IF NOT EXISTS "show_qr_code" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "creatives" ADD COLUMN IF NOT EXISTS "qr_code_text" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "creatives" ADD COLUMN IF NOT EXISTS "logo_path" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "creatives" ADD COLUMN IF NOT EXISTS "product_image_path" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "creatives" ADD COLUMN IF NOT EXISTS "video_path" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "creatives" ADD COLUMN IF NOT EXISTS "template_image_path" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "creatives" ADD COLUMN IF NOT EXISTS "campaign_count" integer NOT NULL DEFAULT '0'`);

    // Do NOT touch "file_name" – it must stay
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN IF EXISTS "campaign_count"`);
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN IF EXISTS "template_image_path"`);
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN IF EXISTS "video_path"`);
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN IF EXISTS "product_image_path"`);
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN IF EXISTS "logo_path"`);
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN IF EXISTS "qr_code_text"`);
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN IF EXISTS "show_qr_code"`);
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN IF EXISTS "features"`);
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN IF EXISTS "product_name"`);
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN IF EXISTS "price"`);
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN IF EXISTS "brand_name"`);
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN IF EXISTS "video_position"`);
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN IF EXISTS "theme"`);
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN IF EXISTS "orientation"`);

    await queryRunner.query(`ALTER TABLE "creatives" ADD COLUMN IF NOT EXISTS "end_duration" integer`);
    await queryRunner.query(`ALTER TABLE "creatives" ADD COLUMN IF NOT EXISTS "thumbnail_s3_key" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "creatives" ADD COLUMN IF NOT EXISTS "duration" integer`);
    await queryRunner.query(`ALTER TABLE "creatives" ADD COLUMN IF NOT EXISTS "mime_type" character varying(100) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "creatives" ADD COLUMN IF NOT EXISTS "file_size" bigint NOT NULL`);
    await queryRunner.query(`ALTER TABLE "creatives" ADD COLUMN IF NOT EXISTS "s3_bucket" character varying(255) NOT NULL DEFAULT 'airspot-ctv-assets'`);
    await queryRunner.query(`ALTER TABLE "creatives" ADD COLUMN IF NOT EXISTS "s3_key" character varying(500) NOT NULL`);

    // Again, we never touch "file_name"
  }

}