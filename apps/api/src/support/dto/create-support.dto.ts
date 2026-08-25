import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

/** ฟอร์มติดต่อฝ่ายสนับสนุน – Feature 3.4 (Contact Support มีทุกหน้า) */
export class CreateSupportDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEmail({}, { message: 'รูปแบบอีเมลไม่ถูกต้อง' })
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  topic!: string;

  @IsString()
  @MinLength(10, { message: 'กรุณาระบุรายละเอียดอย่างน้อย 10 ตัวอักษร' })
  @MaxLength(2000)
  message!: string;
}
