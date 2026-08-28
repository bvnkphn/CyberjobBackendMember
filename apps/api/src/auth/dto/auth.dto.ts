import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export enum RegistrationRole {
  JOBSEEKER = 'JOBSEEKER',
  EMPLOYER = 'EMPLOYER',
}

export class RegisterDto {
  @IsEmail({}, { message: 'รูปแบบอีเมลไม่ถูกต้อง' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' })
  @MaxLength(72, { message: 'รหัสผ่านยาวเกินไป' })
  @Matches(/[a-zA-Z]/, { message: 'รหัสผ่านต้องมีตัวอักษรอย่างน้อย 1 ตัว' })
  @Matches(/[0-9]/, { message: 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว' })
  password!: string;

  @IsString()
  @MinLength(2, { message: 'กรุณาระบุชื่อ' })
  @MaxLength(120)
  name!: string;

  @IsEnum(RegistrationRole, { message: 'ประเภทบัญชีไม่ถูกต้อง' })
  @IsOptional()
  role: RegistrationRole = RegistrationRole.JOBSEEKER;
}

export class LoginDto {
  @IsEmail({}, { message: 'รูปแบบอีเมลไม่ถูกต้อง' })
  email!: string;

  @IsString()
  @MinLength(1, { message: 'กรุณากรอกรหัสผ่าน' })
  password!: string;
}
