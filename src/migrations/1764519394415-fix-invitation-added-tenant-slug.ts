import { MigrationInterface, QueryRunner } from "typeorm";

export class FixInvitationAddedTenantSlug1764519394415 implements MigrationInterface {
    name = 'FixInvitationAddedTenantSlug1764519394415'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invitations" ADD "tenant_slug" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invitations" DROP COLUMN "tenant_slug"`);
    }

}
