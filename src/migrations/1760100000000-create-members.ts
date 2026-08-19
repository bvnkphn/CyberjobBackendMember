import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMembers1760100000000 implements MigrationInterface {
  name = "CreateMembers1760100000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "members" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "email" varchar(255) NOT NULL, "password_hash" varchar(255) NOT NULL, "is_demo" boolean NOT NULL DEFAULT false, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "UQ_members_email" UNIQUE ("email"), CONSTRAINT "PK_members" PRIMARY KEY ("id"))`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "members"`);
  }
}
