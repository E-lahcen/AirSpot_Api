import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1764541263018 implements MigrationInterface {
  name = 'InitialMigration1764541263018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure uuid-ossp extension is available
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(
      `CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying(100) NOT NULL, "company_name" character varying(255) NOT NULL, "schema_name" character varying(100) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "owner_email" character varying(255) NOT NULL, "owner_id" uuid, "created_by" character varying(255), "members_count" integer NOT NULL DEFAULT '0', "description" text, "logo" text, "region" character varying(100), "default_role" character varying(50), "enforce_domain" boolean NOT NULL DEFAULT false, "domain" character varying(255), "firebase_tenant_id" character varying(128), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2310ecc5cb8be427097154b18fc" UNIQUE ("slug"), CONSTRAINT "UQ_c2a961556326eec0e3b19f3ced5" UNIQUE ("schema_name"), CONSTRAINT "UQ_0412ae68322ab2f0b5830531117" UNIQUE ("firebase_tenant_id"), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_tenant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "email" character varying NOT NULL, "user_id" uuid NOT NULL, "tenant_id" uuid NOT NULL, CONSTRAINT "UQ_225891cc5883f1c35aa9091642c" UNIQUE ("user_id", "tenant_id"), CONSTRAINT "PK_ae07d48a61ca20ab3586d397a71" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying(50) NOT NULL, "description" text, CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "first_name" character varying(255), "last_name" character varying(255), "full_name" character varying(255), "company_name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "firebase_uid" character varying(128) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_0fd54ced5cc75f7cb92925dd803" UNIQUE ("firebase_uid"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" text, "orientation" character varying(50) NOT NULL, "theme" character varying(100) NOT NULL, "video_position" character varying(50) NOT NULL, "brand_name" character varying(255) NOT NULL, "price" character varying(50) NOT NULL, "product_name" character varying(255) NOT NULL, "features" text array NOT NULL DEFAULT '{}', "show_qr_code" boolean NOT NULL DEFAULT false, "qr_code_text" character varying(500), "logo_path" character varying(500), "product_image_path" character varying(500), "video_path" character varying(500), "template_image_path" character varying(500), "owner_id" uuid NOT NULL, CONSTRAINT "PK_515948649ce0bbbe391de702ae5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "storyboards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "title" character varying(255) NOT NULL, "duration" character varying(50) NOT NULL, "scenes" text NOT NULL, "scenes_data" jsonb NOT NULL, "video_url" character varying(500) NOT NULL, "owner_id" uuid NOT NULL, CONSTRAINT "PK_6c841a5aa655249cf5fc21c6273" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invitations_type_enum" AS ENUM('tenant_registration', 'collaboration', 'role_assignment', 'resource_access', 'event_participation', 'document_review')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invitations_status_enum" AS ENUM('pending', 'accepted', 'expired', 'revoked')`,
    );
    await queryRunner.query(
      `CREATE TABLE "invitations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "email" character varying NOT NULL, "invitor_id" uuid NOT NULL, "type" "public"."invitations_type_enum" NOT NULL DEFAULT 'tenant_registration', "tenant_id" uuid NOT NULL, "tenant_slug" character varying NOT NULL, "role_id" uuid, "status" "public"."invitations_status_enum" NOT NULL DEFAULT 'pending', "token" character varying NOT NULL, "expires_at" TIMESTAMP NOT NULL, "metadata" jsonb, CONSTRAINT "UQ_e577dcf9bb6d084373ed3998509" UNIQUE ("token"), CONSTRAINT "PK_5dec98cfdfd562e4ad3648bbb07" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."campaigns_goal_enum" AS ENUM('AWARENESS', 'CONVERSIONS', 'TRAFFIC', 'RETARGET', 'APP_REVENUE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."campaigns_budget_type_enum" AS ENUM('LIFETIME', 'DAILY')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."campaigns_status_enum" AS ENUM('DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "campaigns" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "goal" "public"."campaigns_goal_enum" NOT NULL, "budget_type" "public"."campaigns_budget_type_enum" NOT NULL, "budget_amount" numeric(10,2) NOT NULL, "start_date" TIMESTAMP NOT NULL, "end_date" TIMESTAMP NOT NULL, "status" "public"."campaigns_status_enum" NOT NULL DEFAULT 'DRAFT', "owner_id" uuid NOT NULL, "published_at" TIMESTAMP, CONSTRAINT "PK_831e3fcd4fc45b4e4c3f57a9ee4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."audiences_type_enum" AS ENUM('Demographic', 'Interest', 'Geography', 'Behavior', 'Channel', 'Delivery Time')`,
    );
    await queryRunner.query(
      `CREATE TABLE "audiences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "variation_id" uuid, "type" "public"."audiences_type_enum" NOT NULL, "provider_id" integer, "target_id" character varying(255), "owner_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "size" character varying(255) NOT NULL, "reached" character varying(255) NOT NULL, "platforms" json, "campaigns" json, "selected_locations" json, "selected_interests" json, "age_range" json, "selected_genders" json, CONSTRAINT "PK_d87c8fe1be471372dd505a9dc1f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ad_variations_bidding_strategy_enum" AS ENUM('AUTOMATIC', 'MANUAL_CPM')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ad_variations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "campaign_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "creative_id" uuid, "bidding_strategy" "public"."ad_variations_bidding_strategy_enum" NOT NULL DEFAULT 'AUTOMATIC', "cpm_bid" numeric(10,2), "owner_id" uuid NOT NULL, CONSTRAINT "PK_0f4722fec6b75a35f092ba94c5c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "creatives" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" text, "orientation" character varying(50), "theme" character varying(50), "video_position" character varying(50), "brand_name" character varying(255), "price" character varying(50), "product_name" character varying(255), "features" text array, "show_qr_code" boolean NOT NULL DEFAULT false, "qr_code_text" character varying(500), "logo_path" character varying(500), "product_image_path" character varying(500), "video_path" character varying(500), "template_image_path" character varying(500), "file_name" character varying(500) NOT NULL, "campaign_count" integer NOT NULL DEFAULT '0', "owner_id" uuid NOT NULL, CONSTRAINT "PK_fb146841da64b2b38449f618daf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users_roles_roles" ("user_id" uuid NOT NULL, "role_id" uuid NOT NULL, CONSTRAINT "PK_4f5382a23fff88b69c0767b700d" PRIMARY KEY ("user_id", "role_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_32e5adf0a2e33e130de343c6ee" ON "users_roles_roles" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_38703d4da3789a6ad8552ba783" ON "users_roles_roles" ("role_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user_tenant" ADD CONSTRAINT "FK_2393aeb9c992e95d200b13528b5" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "templates" ADD CONSTRAINT "FK_aa53d14ade9be5c31a2f2127304" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "storyboards" ADD CONSTRAINT "FK_b12861e3919a979341eccb6682d" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "FK_e4950c4d6aa2236f5213538e01a" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "FK_0fed9486fae089772de5897541b" FOREIGN KEY ("invitor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD CONSTRAINT "FK_667fd3f5d437c26c052226e7e43" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audiences" ADD CONSTRAINT "FK_17d3543f0a4ddde17e022304160" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audiences" ADD CONSTRAINT "FK_1ded1ee4ff94edf6acb2f273226" FOREIGN KEY ("variation_id") REFERENCES "ad_variations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_variations" ADD CONSTRAINT "FK_1982d69e0c861597cf1e47a773a" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_variations" ADD CONSTRAINT "FK_0608bedb2fd60736b3c340b68f0" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_variations" ADD CONSTRAINT "FK_bceb3bc20c04e95c433d936e8bc" FOREIGN KEY ("creative_id") REFERENCES "creatives"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD CONSTRAINT "FK_8fc1c0e62b2d5d19e27fb5f816a" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_roles_roles" ADD CONSTRAINT "FK_32e5adf0a2e33e130de343c6ee8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_roles_roles" ADD CONSTRAINT "FK_38703d4da3789a6ad8552ba783e" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users_roles_roles" DROP CONSTRAINT "FK_38703d4da3789a6ad8552ba783e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_roles_roles" DROP CONSTRAINT "FK_32e5adf0a2e33e130de343c6ee8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" DROP CONSTRAINT "FK_8fc1c0e62b2d5d19e27fb5f816a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_variations" DROP CONSTRAINT "FK_bceb3bc20c04e95c433d936e8bc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_variations" DROP CONSTRAINT "FK_0608bedb2fd60736b3c340b68f0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_variations" DROP CONSTRAINT "FK_1982d69e0c861597cf1e47a773a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audiences" DROP CONSTRAINT "FK_1ded1ee4ff94edf6acb2f273226"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audiences" DROP CONSTRAINT "FK_17d3543f0a4ddde17e022304160"`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP CONSTRAINT "FK_667fd3f5d437c26c052226e7e43"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_0fed9486fae089772de5897541b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_e4950c4d6aa2236f5213538e01a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "storyboards" DROP CONSTRAINT "FK_b12861e3919a979341eccb6682d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "templates" DROP CONSTRAINT "FK_aa53d14ade9be5c31a2f2127304"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_tenant" DROP CONSTRAINT "FK_2393aeb9c992e95d200b13528b5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_38703d4da3789a6ad8552ba783"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_32e5adf0a2e33e130de343c6ee"`,
    );
    await queryRunner.query(`DROP TABLE "users_roles_roles"`);
    await queryRunner.query(`DROP TABLE "creatives"`);
    await queryRunner.query(`DROP TABLE "ad_variations"`);
    await queryRunner.query(
      `DROP TYPE "public"."ad_variations_bidding_strategy_enum"`,
    );
    await queryRunner.query(`DROP TABLE "audiences"`);
    await queryRunner.query(`DROP TYPE "public"."audiences_type_enum"`);
    await queryRunner.query(`DROP TABLE "campaigns"`);
    await queryRunner.query(`DROP TYPE "public"."campaigns_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."campaigns_budget_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."campaigns_goal_enum"`);
    await queryRunner.query(`DROP TABLE "invitations"`);
    await queryRunner.query(`DROP TYPE "public"."invitations_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."invitations_type_enum"`);
    await queryRunner.query(`DROP TABLE "storyboards"`);
    await queryRunner.query(`DROP TABLE "templates"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "user_tenant"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
  }
}
