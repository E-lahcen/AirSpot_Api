import { MigrationInterface, QueryRunner } from "typeorm";

export class CreativeEntityUpdate1764451387072 implements MigrationInterface {
    name = 'CreativeEntityUpdate1764451387072'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "file_name"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "s3_key"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "s3_bucket"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "file_size"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "mime_type"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "duration"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "thumbnail_s3_key"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "end_duration"`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "orientation" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "theme" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "video_position" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "brand_name" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "price" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "product_name" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "features" text array`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "show_qr_code" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "qr_code_text" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "logo_path" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "product_image_path" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "video_path" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "template_image_path" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "filename" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "campaign_count" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "file_name" character varying(500) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "s3_key" character varying(500) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "s3_bucket" character varying(255) NOT NULL DEFAULT 'airspot-ctv-assets'`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "file_size" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "mime_type" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "duration" integer`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "end_duration" integer`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "thumbnail_s3_key" character varying(500)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "thumbnail_s3_key"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "end_duration"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "duration"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "mime_type"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "file_size"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "s3_bucket"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "s3_key"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "file_name"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "campaign_count"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "filename"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "template_image_path"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "video_path"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "product_image_path"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "logo_path"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "qr_code_text"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "show_qr_code"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "features"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "product_name"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "price"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "brand_name"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "video_position"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "theme"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "orientation"`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "end_duration" integer`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "thumbnail_s3_key" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "duration" integer`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "mime_type" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "file_size" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "s3_bucket" character varying(255) NOT NULL DEFAULT 'airspot-ctv-assets'`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "s3_key" character varying(500) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "file_name" character varying(500) NOT NULL`);
    }

}
