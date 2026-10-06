import { IsBoolean, IsOptional, IsString } from "class-validator";

export class UpdateSettingsDto {
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @IsOptional()
  @IsString()
  announcementTitle?: string;

  @IsOptional()
  @IsString()
  announcementMsg?: string;

  @IsOptional()
  @IsString()
  estimatedDowntime?: string;

  @IsOptional()
  @IsString()
  maintenanceStart?: string;

  @IsOptional()
  @IsString()
  maintenanceEnd?: string;

  @IsOptional()
  @IsBoolean()
  newOrderAlert?: boolean;

  @IsOptional()
  @IsBoolean()
  failedTransactionAlert?: boolean;

  @IsOptional()
  @IsBoolean()
  lowApiAlert?: boolean;

  @IsOptional()
  @IsBoolean()
  dailyReportEmail?: boolean;

  @IsOptional()
  @IsString()
  alertRecipients?: string;

  @IsOptional()
  @IsString()
  dailyReportTime?: string;

  @IsOptional()
  @IsString()
  platformName?: string;

  @IsOptional()
  @IsString()
  supportEmail?: string;

  @IsOptional()
  @IsString()
  supportPhone?: string;

  @IsOptional()
  @IsBoolean()
  registrationEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  jobPostingEnabled?: boolean;
}

export class TestEmailDto {
  @IsString()
  recipient!: string;
}
