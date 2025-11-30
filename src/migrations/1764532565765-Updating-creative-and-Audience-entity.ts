import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatingCreativeAndAudienceEntity1764532565765
  implements MigrationInterface
{
  name = 'UpdatingCreativeAndAudienceEntity1764532565765';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_0fed9486fae089772de5897541b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_e4950c4d6aa2236f5213538e01a"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."audiences_type_enum" AS ENUM('Demographic', 'Interest', 'Geography', 'Behavior', 'Channel', 'Delivery Time')`,
    );
    await queryRunner.query(
      `CREATE TABLE "audiences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "variation_id" uuid, "type" "public"."audiences_type_enum" NOT NULL, "provider_id" integer, "target_id" character varying(255), "owner_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "size" character varying(255) NOT NULL, "reached" character varying(255) NOT NULL, "platforms" json, "campaigns" json, "selected_locations" json, "selected_interests" json, "age_range" json, "selected_genders" json, CONSTRAINT "PK_d87c8fe1be471372dd505a9dc1f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" DROP COLUMN "orientation"`,
    );
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "theme"`);
    await queryRunner.query(
      `ALTER TABLE "creatives" DROP COLUMN "video_position"`,
    );
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "brand_name"`);
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "price"`);
    await queryRunner.query(
      `ALTER TABLE "creatives" DROP COLUMN "product_name"`,
    );
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "features"`);
    await queryRunner.query(
      `ALTER TABLE "creatives" DROP COLUMN "show_qr_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" DROP COLUMN "qr_code_text"`,
    );
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "logo_path"`);
    await queryRunner.query(
      `ALTER TABLE "creatives" DROP COLUMN "product_image_path"`,
    );
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "video_path"`);
    await queryRunner.query(
      `ALTER TABLE "creatives" DROP COLUMN "template_image_path"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" DROP COLUMN "campaign_count"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP COLUMN "invitor_id"`,
    );
    await queryRunner.query(`ALTER TABLE "invitations" DROP COLUMN "role_id"`);
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP COLUMN "tenant_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP COLUMN "tenant_slug"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD "invitor_id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD "tenant_id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD "tenant_slug" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "invitations" ADD "role_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "orientation" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "theme" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "video_position" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "brand_name" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "price" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "product_name" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "features" text array`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "show_qr_code" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "qr_code_text" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "logo_path" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "product_image_path" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "video_path" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "template_image_path" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "file_name" character varying(500) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "campaign_count" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "s3_key" character varying(500) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "s3_bucket" character varying(255) NOT NULL DEFAULT 'airspot-ctv-assets'`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "file_size" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "mime_type" character varying(100) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "creatives" ADD "duration" integer`);
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "end_duration" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "thumbnail_s3_key" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD "invited_by" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD "role" character varying(50) NOT NULL DEFAULT 'member'`,
    );
    await queryRunner.query(`ALTER TABLE "invitations" DROP COLUMN "email"`);
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD "email" character varying(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "UQ_e577dcf9bb6d084373ed3998509"`,
    );
    await queryRunner.query(`ALTER TABLE "invitations" DROP COLUMN "token"`);
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD "token" character varying(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "UQ_e577dcf9bb6d084373ed3998509" UNIQUE ("token")`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "FK_e4950c4d6aa2236f5213538e01a" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "FK_0fed9486fae089772de5897541b" FOREIGN KEY ("invitor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audiences" ADD CONSTRAINT "FK_17d3543f0a4ddde17e022304160" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audiences" ADD CONSTRAINT "FK_1ded1ee4ff94edf6acb2f273226" FOREIGN KEY ("variation_id") REFERENCES "ad_variations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audiences" DROP CONSTRAINT "FK_1ded1ee4ff94edf6acb2f273226"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audiences" DROP CONSTRAINT "FK_17d3543f0a4ddde17e022304160"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_0fed9486fae089772de5897541b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_e4950c4d6aa2236f5213538e01a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "UQ_e577dcf9bb6d084373ed3998509"`,
    );
    await queryRunner.query(`ALTER TABLE "invitations" DROP COLUMN "token"`);
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD "token" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "UQ_e577dcf9bb6d084373ed3998509" UNIQUE ("token")`,
    );
    await queryRunner.query(`ALTER TABLE "invitations" DROP COLUMN "email"`);
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD "email" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "invitations" DROP COLUMN "role"`);
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP COLUMN "invited_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" DROP COLUMN "thumbnail_s3_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" DROP COLUMN "end_duration"`,
    );
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "duration"`);
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "mime_type"`);
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "file_size"`);
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "s3_bucket"`);
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "s3_key"`);
    await queryRunner.query(
      `ALTER TABLE "creatives" DROP COLUMN "campaign_count"`,
    );
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "file_name"`);
    await queryRunner.query(
      `ALTER TABLE "creatives" DROP COLUMN "template_image_path"`,
    );
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "video_path"`);
    await queryRunner.query(
      `ALTER TABLE "creatives" DROP COLUMN "product_image_path"`,
    );
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "logo_path"`);
    await queryRunner.query(
      `ALTER TABLE "creatives" DROP COLUMN "qr_code_text"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" DROP COLUMN "show_qr_code"`,
    );
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "features"`);
    await queryRunner.query(
      `ALTER TABLE "creatives" DROP COLUMN "product_name"`,
    );
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "price"`);
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "brand_name"`);
    await queryRunner.query(
      `ALTER TABLE "creatives" DROP COLUMN "video_position"`,
    );
    await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "theme"`);
    await queryRunner.query(
      `ALTER TABLE "creatives" DROP COLUMN "orientation"`,
    );
    await queryRunner.query(`ALTER TABLE "invitations" DROP COLUMN "role_id"`);
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP COLUMN "tenant_slug"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP COLUMN "tenant_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP COLUMN "invitor_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD "tenant_slug" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD "tenant_id" uuid NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "invitations" ADD "role_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD "invitor_id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "campaign_count" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "template_image_path" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "video_path" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "product_image_path" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "logo_path" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "qr_code_text" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "show_qr_code" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "features" text array`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "product_name" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "price" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "brand_name" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "video_position" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "theme" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD "orientation" character varying(50)`,
    );
    await queryRunner.query(`DROP TABLE "audiences"`);
    await queryRunner.query(`DROP TYPE "public"."audiences_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "FK_e4950c4d6aa2236f5213538e01a" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "FK_0fed9486fae089772de5897541b" FOREIGN KEY ("invitor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
