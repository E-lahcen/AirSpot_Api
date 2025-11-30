import { MigrationInterface, QueryRunner } from "typeorm";

export class FixInvitationEntity1764518388726 implements MigrationInterface {
    name = 'FixInvitationEntity1764518388726'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invitations" DROP COLUMN "invited_by"`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP COLUMN "role"`);
        await queryRunner.query(`ALTER TABLE "creatives" DROP COLUMN "filename"`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD "invitor_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD "role_id" uuid`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD "email" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "UQ_invitations_token"`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP COLUMN "token"`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD "token" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "UQ_e577dcf9bb6d084373ed3998509" UNIQUE ("token")`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "FK_e4950c4d6aa2236f5213538e01a" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "FK_0fed9486fae089772de5897541b" FOREIGN KEY ("invitor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ad_variations" ADD CONSTRAINT "FK_bceb3bc20c04e95c433d936e8bc" FOREIGN KEY ("creative_id") REFERENCES "creatives"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD CONSTRAINT "FK_8fc1c0e62b2d5d19e27fb5f816a" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "creatives" DROP CONSTRAINT "FK_8fc1c0e62b2d5d19e27fb5f816a"`);
        await queryRunner.query(`ALTER TABLE "ad_variations" DROP CONSTRAINT "FK_bceb3bc20c04e95c433d936e8bc"`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_0fed9486fae089772de5897541b"`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_e4950c4d6aa2236f5213538e01a"`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "UQ_e577dcf9bb6d084373ed3998509"`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP COLUMN "token"`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD "token" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "UQ_invitations_token" UNIQUE ("token")`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD "email" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP COLUMN "role_id"`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP COLUMN "invitor_id"`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "creatives" ADD "filename" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD "role" character varying(50) NOT NULL DEFAULT 'member'`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD "invited_by" uuid NOT NULL`);
    }

}
