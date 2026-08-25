import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import type {
  EmploymentType,
  ExperienceLevel,
  JobSort,
  PostedWithin,
  WorkStyle,
} from '@cyberjob/shared';

const WORK_STYLE_VALUES = ['onsite', 'hybrid', 'remote'];
const EMPLOYMENT_VALUES = [
  'fulltime',
  'parttime',
  'contract',
  'temporary',
  'internship',
];
const EXPERIENCE_VALUES = ['0', '1-2', '3-5', '6-10', '10+'];
const POSTED_VALUES = ['all', '1', '3', '7', '14', '30'];
const SORT_VALUES = ['newest', 'oldest', 'salary_desc', 'salary_asc'];

/** รับได้ทั้ง ?workStyle=a&workStyle=b และ ?workStyle=a,b */
const toArray = ({ value }: { value: unknown }): string[] | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const raw = Array.isArray(value) ? value : [value];
  const flat = raw
    .flatMap((v) => String(v).split(','))
    .map((v) => v.trim())
    .filter(Boolean);
  return flat.length ? flat : undefined;
};

export class QueryJobsDto {
  /** คำค้น: ชื่อตำแหน่งงาน / ทักษะ / ชื่อบริษัท (Feature 3.1) */
  @IsOptional()
  @IsString()
  q?: string;

  /** สาขาอาชีพ (Feature 3.1) */
  @IsOptional()
  @IsString()
  category?: string;

  /** จังหวัดของสถานประกอบการ – เลือกได้หลายจังหวัด (Feature 3.1) */
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsString({ each: true })
  province?: string[];

  /** จำกัดเฉพาะงานของบริษัทหนึ่ง (ใช้ในหน้าโปรไฟล์บริษัท) */
  @IsOptional()
  @IsString()
  companySlug?: string;

  /** รูปแบบการทำงาน (Feature 3.2) */
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsIn(WORK_STYLE_VALUES, { each: true })
  workStyle?: WorkStyle[];

  /** ประเภทงาน (Feature 3.2) */
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsIn(EMPLOYMENT_VALUES, { each: true })
  employmentType?: EmploymentType[];

  /** ประสบการณ์ทำงาน (Feature 3.2) */
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsIn(EXPERIENCE_VALUES, { each: true })
  experience?: ExperienceLevel[];

  /** เงินเดือนต่ำสุด (Feature 3.2) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salaryMin?: number;

  /** เงินเดือนสูงสุด (Feature 3.2) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salaryMax?: number;

  /** ประกาศเมื่อ (Feature 3.2) */
  @IsOptional()
  @IsIn(POSTED_VALUES)
  postedWithin?: PostedWithin;

  /** การเรียงลำดับ – ค่าเริ่มต้นคือใหม่ไปเก่า (Feature 3.3) */
  @IsOptional()
  @IsIn(SORT_VALUES)
  sort?: JobSort;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}
