import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCandidateProfiles1760000000000 implements MigrationInterface {
  name = "CreateCandidateProfiles1760000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "candidate_profiles" (
        "user_id" uuid NOT NULL,
        "gate_completed" boolean NOT NULL DEFAULT false,
        "first_name" varchar(120),
        "last_name" varchar(120),
        "address" text,
        "privacy" varchar(16) NOT NULL DEFAULT 'public',
        "desired_job_categories" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "personal" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "desired_job" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "educations" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "work_experiences" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "certificates" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "languages" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "other_skills" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_candidate_profiles" PRIMARY KEY ("user_id"),
        CONSTRAINT "CHK_candidate_profiles_privacy" CHECK ("privacy" IN ('public','private'))
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "candidate_profiles"`);
  }
}
