import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "candidate_profiles" })
export class CandidateProfile {
  @PrimaryColumn({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ name: "gate_completed", default: false })
  gateCompleted!: boolean;

  @Column({ name: "first_name", type: "varchar", length: 120, nullable: true })
  firstName!: string | null;

  @Column({ name: "last_name", type: "varchar", length: 120, nullable: true })
  lastName!: string | null;

  @Column({ type: "text", nullable: true })
  address!: string | null;

  @Column({ type: "varchar", length: 16, default: "public" })
  privacy!: "public" | "private";

  @Column({ name: "desired_job_categories", type: "jsonb", default: () => "'[]'::jsonb" })
  desiredJobCategories!: string[];

  @Column({ type: "jsonb", default: () => "'{}'::jsonb" })
  personal!: Record<string, unknown>;

  @Column({ name: "desired_job", type: "jsonb", default: () => "'{}'::jsonb" })
  desiredJob!: Record<string, unknown>;

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  educations!: unknown[];

  @Column({ name: "work_experiences", type: "jsonb", default: () => "'[]'::jsonb" })
  workExperiences!: unknown[];

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  certificates!: unknown[];

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  languages!: unknown[];

  @Column({ name: "other_skills", type: "jsonb", default: () => "'{}'::jsonb" })
  otherSkills!: Record<string, unknown>;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
