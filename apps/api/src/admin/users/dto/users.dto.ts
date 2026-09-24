import { Transform, Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export const CANDIDATE_SOURCES = ["CYBERPAY_INTERN", "OUTSIDER"] as const;
export type CandidateSource = (typeof CANDIDATE_SOURCES)[number];

export const USER_SORTS = ["newest", "experience_asc", "experience_desc"] as const;
export const PAGE_SIZES = [20, 50, 100] as const;

const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value);

/** Feature 3 – ค้นหา ตัวกรอง และการเรียงของตารางผู้สมัคร */
export class QueryUsersDto {
  /** ค้นหาจาก UserID, ชื่อ, Email หรือตำแหน่งที่สนใจ */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(trim)
  q?: string;

  @IsOptional()
  @IsIn(CANDIDATE_SOURCES)
  source?: CandidateSource;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  minYears?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  maxYears?: number;

  @IsOptional()
  @IsIn(USER_SORTS)
  sort: (typeof USER_SORTS)[number] = "newest";

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

/** แก้ไขข้อมูลผู้สมัคร – แก้ได้เฉพาะแหล่งที่มา ฟิลด์อื่นเป็นแบบอ่านอย่างเดียว */
export class UpdateUserDto {
  @IsIn(CANDIDATE_SOURCES)
  candidateSource!: CandidateSource;
}
