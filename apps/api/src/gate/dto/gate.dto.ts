import { IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class SaveGateDto {
  @IsString() @MaxLength(80) firstName!: string;
  @IsString() @MaxLength(80) lastName!: string;
  @IsString() @MaxLength(500) address!: string;
  @IsArray() @IsString({ each: true }) desiredJobCategories!: string[];
  @IsIn(['public', 'private']) privacy!: 'public' | 'private';
}

export class SkipGateDto {
  @IsOptional() @IsIn(['public', 'private']) privacy?: 'public' | 'private';
}
