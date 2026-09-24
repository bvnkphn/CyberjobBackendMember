import { Transform, Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export const EXPERIENCE_LEVELS = ["NONE", "ONE_TWO", "THREE_FIVE", "SIX_TEN", "TEN_PLUS"] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const PAGE_SIZES = [20, 50, 100] as const;

const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value);

/** Feature 5 – ค้นหา + ตัวกรองของตารางประกาศงาน */
export class QueryJobsDto {
  /** ชื่อบริษัทหรือตำแหน่ง */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(trim)
  q?: string;

  /** อายุงานที่ต้องการ */
  @IsOptional()
  @IsIn(EXPERIENCE_LEVELS)
  experience?: ExperienceLevel;

  /** ตำแหน่งที่ต้องการ (ตรงกับชื่อตำแหน่งทั้งคำ) */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(trim)
  title?: string;

  /** เงินเดือนขั้นต่ำ – แสดงเฉพาะงานที่ให้เงินเดือนเริ่มต้นตั้งแต่ค่านี้ขึ้นไป */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  salaryMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsIn(PAGE_SIZES)
  pageSize: (typeof PAGE_SIZES)[number] = 20;
}
