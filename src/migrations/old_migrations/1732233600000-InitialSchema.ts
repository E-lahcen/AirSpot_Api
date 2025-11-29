import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1732233600000 implements MigrationInterface {
  name = 'InitialSchema1732233600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension for UUID generation
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create tenants table
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "slug" character varying(100) NOT NULL,
        "company_name" character varying(255) NOT NULL,
        "schema_name" character varying(100) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "owner_email" character varying(255) NOT NULL,
        "created_by" character varying(255),
        "members_count" integer NOT NULL DEFAULT 0,
        "firebase_tenant_id" character varying(128),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_tenants_slug" UNIQUE ("slug"),
        CONSTRAINT "UQ_tenants_schema_name" UNIQUE ("schema_name"),
        CONSTRAINT "UQ_tenants_firebase_tenant_id" UNIQUE ("firebase_tenant_id"),
        CONSTRAINT "PK_tenants" PRIMARY KEY ("id")
      )
    `);

    // Create roles table
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(50) NOT NULL,
        "description" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_roles_name" UNIQUE ("name"),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id")
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "first_name" character varying(255),
        "last_name" character varying(255),
        "full_name" character varying(255),
        "company_name" character varying(255) NOT NULL,
        "email" character varying(255) NOT NULL,
        "firebase_uid" character varying(128) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "UQ_users_firebase_uid" UNIQUE ("firebase_uid"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create user-role junction table
    await queryRunner.query(`
      CREATE TABLE "users_roles_roles" (
        "user_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        CONSTRAINT "PK_users_roles" PRIMARY KEY ("user_id", "role_id")
      )
    `);

    // Create invitations table with enum types
    await queryRunner.query(`
      CREATE TYPE "invitations_type_enum" AS ENUM(
        'tenant_registration',
        'collaboration',
        'role_assignment',
        'resource_access',
        'event_participation',
        'document_review'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "invitations_status_enum" AS ENUM(
        'pending',
        'accepted',
        'expired',
        'revoked'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "invitations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "invited_by" uuid NOT NULL,
        "type" "invitations_type_enum" NOT NULL DEFAULT 'tenant_registration',
        "role" character varying(50) NOT NULL DEFAULT 'member',
        "status" "invitations_status_enum" NOT NULL DEFAULT 'pending',
        "token" character varying(255) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_invitations_token" UNIQUE ("token"),
        CONSTRAINT "PK_invitations" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "users_roles_roles"
      ADD CONSTRAINT "FK_users_roles_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "users_roles_roles"
      ADD CONSTRAINT "FK_users_roles_role_id"
      FOREIGN KEY ("role_id") REFERENCES "roles"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_users_roles_user_id" ON "users_roles_roles" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_roles_role_id" ON "users_roles_roles" ("role_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invitations_email" ON "invitations" ("email")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invitations_status" ON "invitations" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_invitations_status"`);
    await queryRunner.query(`DROP INDEX "IDX_invitations_email"`);
    await queryRunner.query(`DROP INDEX "IDX_users_roles_role_id"`);
    await queryRunner.query(`DROP INDEX "IDX_users_roles_user_id"`);

    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "users_roles_roles" DROP CONSTRAINT "FK_users_roles_role_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_roles_roles" DROP CONSTRAINT "FK_users_roles_user_id"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE "invitations"`);
    await queryRunner.query(`DROP TYPE "invitations_status_enum"`);
    await queryRunner.query(`DROP TYPE "invitations_type_enum"`);
    await queryRunner.query(`DROP TABLE "users_roles_roles"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
  }
}
