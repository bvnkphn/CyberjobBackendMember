import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDefined,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class AddBookmarkDto {
  @IsString()
  jobId!: string;
}

export class SyncBookmarksDto {
  @IsArray()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  jobIds!: string[];
}

export class AnswerDto {
  @IsString()
  questionId!: string;

  /** string หรือ string[] – ตรวจชนิดตามประเภทคำถามใน MeService */
  @IsDefined()
  answer!: unknown;
}

export class ApplyDto {
  @IsString()
  jobId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  coverLetter?: string;

  /** คำตอบคำถามคัดกรองของประกาศงาน */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers?: AnswerDto[];
}

export class RespondInvitationDto {
  @IsIn(['accepted', 'declined'], { message: 'สถานะคำเชิญไม่ถูกต้อง' })
  status!: 'accepted' | 'declined';
}
