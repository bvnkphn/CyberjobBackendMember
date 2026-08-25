import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

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

export class ApplyDto {
  @IsString()
  jobId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  coverLetter?: string;
}
