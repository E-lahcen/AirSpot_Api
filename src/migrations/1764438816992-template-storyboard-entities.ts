import { MigrationInterface, QueryRunner } from "typeorm";

export class TemplateStoryboardEntities1764438816992 implements MigrationInterface {
    name = 'TemplateStoryboardEntities1764438816992'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_tenant" DROP CONSTRAINT "FK_2393aeb9c992e95d200b13528b5"`);
        await queryRunner.query(`CREATE TABLE "templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" text, "orientation" character varying(50) NOT NULL, "theme" character varying(100) NOT NULL, "video_position" character varying(50) NOT NULL, "brand_name" character varying(255) NOT NULL, "price" character varying(50) NOT NULL, "product_name" character varying(255) NOT NULL, "features" text array NOT NULL DEFAULT '{}', "show_qr_code" boolean NOT NULL DEFAULT false, "qr_code_text" character varying(500), "logo_path" character varying(500), "product_image_path" character varying(500), "video_path" character varying(500), "template_image_path" character varying(500), "owner_id" uuid NOT NULL, CONSTRAINT "PK_515948649ce0bbbe391de702ae5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "storyboards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" uuid NOT NULL, "title" character varying(255) NOT NULL, "duration" character varying(50) NOT NULL, "scenes" text NOT NULL, "scenes_data" jsonb NOT NULL, "video_url" character varying(500) NOT NULL, "owner_id" uuid NOT NULL, CONSTRAINT "PK_6c841a5aa655249cf5fc21c6273" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_tenant" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "user_tenant" ADD CONSTRAINT "FK_2393aeb9c992e95d200b13528b5" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "templates" ADD CONSTRAINT "FK_aa53d14ade9be5c31a2f2127304" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "storyboards" ADD CONSTRAINT "FK_b12861e3919a979341eccb6682d" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "storyboards" DROP CONSTRAINT "FK_b12861e3919a979341eccb6682d"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP CONSTRAINT "FK_aa53d14ade9be5c31a2f2127304"`);
        await queryRunner.query(`ALTER TABLE "user_tenant" DROP CONSTRAINT "FK_2393aeb9c992e95d200b13528b5"`);
        await queryRunner.query(`ALTER TABLE "user_tenant" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`DROP TABLE "storyboards"`);
        await queryRunner.query(`DROP TABLE "templates"`);
        await queryRunner.query(`ALTER TABLE "user_tenant" ADD CONSTRAINT "FK_2393aeb9c992e95d200b13528b5" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
