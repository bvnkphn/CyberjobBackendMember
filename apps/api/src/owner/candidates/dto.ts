import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const toList = ({ value }: { value: unknown }) =>
  Array.isArray(value)
    ? value.map(String)
    : typeof value === "string" && value.trim()
      ? value.split(",").map((item) => item.trim()).filter(Boolean)
      : [];

export class QueryCandidatesDto {
  /** cyberjob = ผู้สมัครทั้งระบบ (Feature 2.1) · company = ผู้ที่สมัครงานของบริษัท (Feature 2.2) */
  @IsOptional()
  @IsIn(["cyberjob", "company"])
  source: "cyberjob" | "company" = "cyberjob";

  /** ชื่อ ทักษะ ตำแหน่ง หรือรหัสผู้ใช้ */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  expMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  expMax?: number;

  /** ต้องมีครบทุกทักษะที่เลือก คั่นด้วยจุลภาค */
  @IsOptional()
  @Transform(toList)
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  skills: string[] = [];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  scoreMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  scoreMax?: number;

  /** จำกัดเฉพาะผู้สมัครของประกาศนี้ */
  @IsOptional()
  @IsString()
  jobId?: string;

  @IsOptional()
  @IsIn(["newest", "oldest", "matching"])
  sort: "newest" | "oldest" | "matching" = "newest";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 10;
}

export class CandidateDetailQueryDto {
  /** เทียบ Matching Score กับประกาศที่ระบุแทนประกาศที่เข้ากันที่สุด */
  @IsOptional()
  @IsString()
  jobId?: string;
}

export class BookmarkDto {
  @IsString()
  candidateId!: string;
}

export class InviteDto {
  @IsString()
  candidateId!: string;

  @IsString()
  jobId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

export class QueryInvitationsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn(["all", "sent", "accepted", "declined"])
  status: "all" | "sent" | "accepted" | "declined" = "all";

  /** ส่งคำเชิญภายในกี่วันที่ผ่านมา */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3650)
  days?: number;

  @IsOptional()
  @IsIn(["newest", "oldest"])
  sort: "newest" | "oldest" = "newest";
}

export class QueryResponsesDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsString()
  jobId?: string;

  /** สมัครภายในกี่วันที่ผ่านมา */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3650)
  days?: number;
}
