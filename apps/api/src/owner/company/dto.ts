import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";


const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value);
const emptyToUndefined = ({ value }: { value: unknown }) =>
  typeof value === "string" && value.trim() === "" ? undefined : typeof value === "string" ? value.trim() : value;

/** หน้า Gate – ข้อมูลยืนยันบริษัท (Owner Feature 8) ส่งมาเป็น multipart พร้อมไฟล์เอกสาร */
export class VerificationDto {
  @Transform(trim)
  @IsString()
  @MinLength(2, { message: "กรุณาระบุชื่อบริษัท" })
  @MaxLength(200)
  companyName!: string;

  @Transform(trim)
  @Matches(/^\d{13}$/, { message: "เลขทะเบียนนิติบุคคลต้องเป็นตัวเลข 13 หลัก" })
  registrationNumber!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1, { message: "กรุณาเลือกประเภทธุรกิจ" })
  @MaxLength(120)
  businessType!: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(60)
  employeeRange?: string;

  @Transform(trim)
  @IsEmail({}, { message: "รูปแบบอีเมลบริษัทไม่ถูกต้อง" })
  companyEmail!: string;

  @Transform(trim)
  @Matches(/^[0-9+\-\s()]{9,20}$/, { message: "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง" })
  companyPhone!: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ["http", "https"] }, { message: "เว็บไซต์ต้องขึ้นต้นด้วย http:// หรือ https://" })
  website?: string;

  @Transform(trim)
  @IsString()
  @MinLength(2, { message: "กรุณาระบุชื่อผู้ติดต่อ" })
  @MaxLength(120)
  contactName!: string;

  @Transform(trim)
  @IsString()
  @MinLength(2, { message: "กรุณาระบุตำแหน่งผู้ติดต่อ" })
  @MaxLength(120)
  contactPosition!: string;

  @Transform(trim)
  @Matches(/^[0-9+\-\s()]{9,20}$/, { message: "รูปแบบเบอร์โทรศัพท์ผู้ติดต่อไม่ถูกต้อง" })
  contactPhone!: string;

  @Transform(trim)
  @IsString()
  @MinLength(5, { message: "กรุณาระบุที่อยู่บริษัท" })
  @MaxLength(500)
  address!: string;

  @Transform(trim)
  @IsString()
  @MinLength(2, { message: "กรุณาเลือกจังหวัด" })
  @MaxLength(80)
  province!: string;
}

/** แก้ไขโปรไฟล์บริษัท (Owner Feature 3.2) */
export class UpdateCompanyDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2, { message: "กรุณาระบุชื่อบริษัท" })
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsIn(["private", "government", "state_enterprise"], { message: "รูปแบบบริษัทไม่ถูกต้อง" })
  companyType?: "private" | "government" | "state_enterprise";

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  businessType?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(60)
  employeeCount?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  about?: string;

  @IsOptional()
  @Transform(trim)
  @IsEmail({}, { message: "รูปแบบอีเมลไม่ถูกต้อง" })
  email?: string;

  @IsOptional()
  @Transform(trim)
  @Matches(/^[0-9+\-\s()]{9,20}$/, { message: "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง" })
  phone?: string;

  @IsOptional()
  @Transform(trim)
  @ValidateIf((_object, value) => value !== "")
  @IsUrl({ require_protocol: true, protocols: ["http", "https"] }, { message: "เว็บไซต์ต้องขึ้นต้นด้วย http:// หรือ https://" })
  website?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(5, { message: "กรุณาระบุที่อยู่บริษัท" })
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  province?: string;

  /** ลิงก์ Google Maps – ว่างได้ */
  @IsOptional()
  @Transform(trim)
  @ValidateIf((_object, value) => value !== "")
  @IsUrl({ require_protocol: true, protocols: ["https"] }, { message: "ลิงก์แผนที่ต้องเป็น https://" })
  @MaxLength(1000)
  mapUrl?: string;

  /** ข้อมูลการยืนยันบริษัท */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(30)
  registrationNumber?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  contactName?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  contactPosition?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(30)
  contactPhone?: string;

  @IsOptional()
  @IsBoolean()
  requestVerification?: boolean;
}

export class RequestVerificationDto {
  @Transform(trim)
  @IsString()
  @MinLength(3, { message: "กรุณาระบุเลขทะเบียนนิติบุคคล" })
  @MaxLength(30)
  registrationNumber!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  contactName?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  contactPosition?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(30)
  contactPhone?: string;
}

export class PrivacyDto {
  @IsIn(["public", "private"], { message: "ค่าความเป็นส่วนตัวไม่ถูกต้อง" })
  visibility!: "public" | "private";
}

export const DOCUMENT_TYPES = ["certificate", "directorId", "workplace", "vat"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
