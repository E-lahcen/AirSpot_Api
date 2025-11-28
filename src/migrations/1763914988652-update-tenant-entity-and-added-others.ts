import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTenantEntityAndAddedOthers1763914988652
  implements MigrationInterface
{
  name = 'UpdateTenantEntityAndAddedOthers1763914988652';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users_roles_roles" DROP CONSTRAINT "FK_users_roles_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_roles_roles" DROP CONSTRAINT "FK_users_roles_role_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_invitations_email"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_invitations_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_roles_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_roles_role_id"`);
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
      `CREATE TABLE "campaigns" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "goal" "public"."campaigns_goal_enum" NOT NULL, "budget_type" "public"."campaigns_budget_type_enum" NOT NULL, "budget_amount" numeric(10,2) NOT NULL, "start_date" TIMESTAMP NOT NULL, "end_date" TIMESTAMP NOT NULL, "status" "public"."campaigns_status_enum" NOT NULL DEFAULT 'DRAFT', "published_at" TIMESTAMP, CONSTRAINT "PK_831e3fcd4fc45b4e4c3f57a9ee4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."target_group_selections_type_enum" AS ENUM('DEMOGRAPHIC', 'INTEREST', 'GEOGRAPHY', 'BEHAVIOR', 'CHANNEL', 'DELIVERY_TIME')`,
    );
    await queryRunner.query(
      `CREATE TABLE "target_group_selections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "variation_id" uuid NOT NULL, "type" "public"."target_group_selections_type_enum" NOT NULL, "provider_id" integer NOT NULL, "target_id" character varying(255) NOT NULL, CONSTRAINT "PK_b5683124a311b00fd5fae0c0094" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ad_variations_bidding_strategy_enum" AS ENUM('AUTOMATIC', 'MANUAL_CPM')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ad_variations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "campaign_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "creative_id" uuid, "bidding_strategy" "public"."ad_variations_bidding_strategy_enum" NOT NULL DEFAULT 'AUTOMATIC', "cpm_bid" numeric(10,2), CONSTRAINT "PK_0f4722fec6b75a35f092ba94c5c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "creatives" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" text, "file_name" character varying(500) NOT NULL, "s3_key" character varying(500) NOT NULL, "s3_bucket" character varying(255) NOT NULL DEFAULT 'airspot-ctv-assets', "file_size" bigint NOT NULL, "mime_type" character varying(100) NOT NULL, "duration" integer, "thumbnail_s3_key" character varying(500), CONSTRAINT "PK_fb146841da64b2b38449f618daf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "role_id" uuid NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8acd5cf26ebd158416f477de799" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "roles" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "owner_id" uuid`);
    await queryRunner.query(
      `CREATE INDEX "IDX_32e5adf0a2e33e130de343c6ee" ON "users_roles_roles" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_38703d4da3789a6ad8552ba783" ON "users_roles_roles" ("role_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD CONSTRAINT "FK_efba90c155ec02ae586fb7ed31d" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD CONSTRAINT "FK_b82fcefa3141cf82e4eb695b73c" FOREIGN KEY ("organization_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "target_group_selections" ADD CONSTRAINT "FK_52800c20ac0d5fa761a7a5ed749" FOREIGN KEY ("organization_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "target_group_selections" ADD CONSTRAINT "FK_f7cf025fd355b915d8ed3a963f6" FOREIGN KEY ("variation_id") REFERENCES "ad_variations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_variations" ADD CONSTRAINT "FK_2c9755b39f7875337b6cc671f66" FOREIGN KEY ("organization_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_variations" ADD CONSTRAINT "FK_0608bedb2fd60736b3c340b68f0" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_variations" ADD CONSTRAINT "FK_bceb3bc20c04e95c433d936e8bc" FOREIGN KEY ("creative_id") REFERENCES "creatives"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" ADD CONSTRAINT "FK_a9257a40a0a87e9c53c9e4eac12" FOREIGN KEY ("organization_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creatives" DROP CONSTRAINT "FK_a9257a40a0a87e9c53c9e4eac12"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_variations" DROP CONSTRAINT "FK_bceb3bc20c04e95c433d936e8bc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_variations" DROP CONSTRAINT "FK_0608bedb2fd60736b3c340b68f0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_variations" DROP CONSTRAINT "FK_2c9755b39f7875337b6cc671f66"`,
    );
    await queryRunner.query(
      `ALTER TABLE "target_group_selections" DROP CONSTRAINT "FK_f7cf025fd355b915d8ed3a963f6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "target_group_selections" DROP CONSTRAINT "FK_52800c20ac0d5fa761a7a5ed749"`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP CONSTRAINT "FK_b82fcefa3141cf82e4eb695b73c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" DROP CONSTRAINT "FK_efba90c155ec02ae586fb7ed31d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_38703d4da3789a6ad8552ba783"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_32e5adf0a2e33e130de343c6ee"`,
    );
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "owner_id"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(`DROP TABLE "creatives"`);
    await queryRunner.query(`DROP TABLE "ad_variations"`);
    await queryRunner.query(
      `DROP TYPE "public"."ad_variations_bidding_strategy_enum"`,
    );
    await queryRunner.query(`DROP TABLE "target_group_selections"`);
    await queryRunner.query(
      `DROP TYPE "public"."target_group_selections_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "campaigns"`);
    await queryRunner.query(`DROP TYPE "public"."campaigns_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."campaigns_budget_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."campaigns_goal_enum"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_users_roles_role_id" ON "users_roles_roles" ("role_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_roles_user_id" ON "users_roles_roles" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invitations_status" ON "invitations" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invitations_email" ON "invitations" ("email") `,
    );
    await queryRunner.query(
      `ALTER TABLE "users_roles_roles" ADD CONSTRAINT "FK_users_roles_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_roles_roles" ADD CONSTRAINT "FK_users_roles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }
}
