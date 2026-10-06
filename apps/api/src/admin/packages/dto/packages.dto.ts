import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

export type PlanEnum = "FREE" | "GOLD" | "PLATINUM";
export const VALID_PLANS: PlanEnum[] = ["FREE", "GOLD", "PLATINUM"];

export class UpsertTierDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  price!: number;

  @IsString()
  @IsIn(["forever", "month", "year"])
  billingCycle!: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  quotaJobs!: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  highlightJobs!: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  candidateViews!: number;

  @IsBoolean()
  @Type(() => Boolean)
  aiMatching!: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  inviteCandidates!: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  dedicatedSupport!: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  popular!: boolean;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder!: number;

  @IsString({ each: true })
  features!: string[];
}

export class QuerySubscribersDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  @IsIn(["FREE", "GOLD", "PLATINUM", "all"])
  plan?: string;

  @IsOptional()
  @IsString()
  @IsIn(["active", "expired", "expiring", "suspended", "all"])
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn(["soonest", "latest", "name_asc"])
  sort?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageSize?: number;
}

export class UpdateSubscriberDto {
  @IsOptional()
  @IsString()
  @IsIn(["FREE", "GOLD", "PLATINUM"])
  plan?: PlanEnum;

  @IsOptional()
  @IsString()
  planExpiresAt?: string | null; // ISO date string or null

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  suspend?: boolean; // true = suspend (set plan to FREE, expire immediately), false = unsuspend
}

export class ReviewPaymentDto {
  @IsString()
  @IsIn(["APPROVED", "REJECTED"])
  status!: "APPROVED" | "REJECTED";

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  /** duration in days when approving; defaults to 30 */
  durationDays?: number;
}
