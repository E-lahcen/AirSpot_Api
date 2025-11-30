import { MigrationInterface, QueryRunner } from "typeorm";

export class FixInvitationAddedTenantId1764519121783 implements MigrationInterface {
    name = 'FixInvitationAddedTenantId1764519121783'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invitations" ADD "tenant_id" uuid NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invitations" DROP COLUMN "tenant_id"`);
    }

}
