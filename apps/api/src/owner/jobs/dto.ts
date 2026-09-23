import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export const QUESTION_TYPES = ["single", "date", "short", "multi", "long"] as const;
export type QuestionTypeApi = (typeof QUESTION_TYPES)[number];

export class JobQuestionDto {
  /** มี id = แก้คำถามเดิม (คำตอบเก่ายังผูกกับคำถามอยู่) · ไม่มี = คำถามใหม่ */
  @IsOptional()
  @IsString()
  id?: string;

  @IsIn(QUESTION_TYPES, { message: "ประเภทคำถามไม่ถูกต้อง" })
  type!: QuestionTypeApi;

  @IsString()
  @MinLength(1, { message: "กรุณาระบุคำถาม" })
  @MaxLength(300)
  text!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  options: string[] = [];

  @IsOptional()
  @IsBoolean()
  required = true;
}

export class SaveJobDto {
  @IsString()
  @MinLength(2, { message: "กรุณาระบุตำแหน่งงาน" })
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(1, { message: "กรุณาเลือกหมวดหมู่" })
  @MaxLength(120)
  category!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  subcategory?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  @IsIn(["onsite", "hybrid", "remote"], { message: "รูปแบบการทำงานไม่ถูกต้อง" })
  workStyle!: "onsite" | "hybrid" | "remote";

  /** ตามชีตสเปก: งานเต็มเวลา สัญญาจ้าง งานชั่วคราว (ตัดฝึกงานออก) */
  @IsIn(["fulltime", "contract", "temporary"], { message: "ประเภทการจ้างงานไม่ถูกต้อง" })
  employmentType!: "fulltime" | "contract" | "temporary";

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  experienceYears = 0;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: "จำนวนที่เปิดรับต้องมีอย่างน้อย 1 อัตรา" })
  @Max(999)
  openings = 1;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  salaryMin!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  salaryMax!: number;

  @IsOptional()
  @IsBoolean()
  salaryNegotiable = false;

  @IsOptional()
  @IsBoolean()
  isUrgent = false;

  @IsString()
  @MaxLength(10_000)
  description!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  skills: string[] = [];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  benefits: string[] = [];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => JobQuestionDto)
  questions: JobQuestionDto[] = [];

  /** draft = บันทึกไว้ ผู้สมัครยังไม่เห็น · published = เผยแพร่ */
  @IsIn(["draft", "published"])
  status!: "draft" | "published";
}

export class QueryJobsDto {
  @IsOptional()
  @IsIn(["all", "published", "draft", "closed"])
  status: "all" | "published" | "draft" | "closed" = "all";

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}
