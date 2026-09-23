import { Equals, IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

/** กติการหัสผ่านเดียวกับตอนสมัครสมาชิกฝั่ง member */
export class ChangePasswordDto {
  @IsString()
  @MinLength(1, { message: "กรุณากรอกรหัสผ่านปัจจุบัน" })
  currentPassword!: string;

  @IsString()
  @MinLength(8, { message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" })
  @MaxLength(72, { message: "รหัสผ่านยาวเกินไป" })
  @Matches(/[a-zA-Z]/, { message: "รหัสผ่านต้องมีตัวอักษรอย่างน้อย 1 ตัว" })
  @Matches(/[0-9]/, { message: "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว" })
  newPassword!: string;
}

export class DeleteAccountDto {
  /** ไม่ต้องส่งเมื่อบัญชีเข้าสู่ระบบด้วย Google */
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsBoolean()
  @Equals(true, { message: "กรุณายืนยันว่าต้องการลบบัญชี" })
  confirm!: boolean;
}
