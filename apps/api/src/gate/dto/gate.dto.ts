import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SaveGateDto {
  @IsString() @IsNotEmpty() @MaxLength(80) firstName!: string;
  @IsString() @IsNotEmpty() @MaxLength(80) lastName!: string;
  @IsString() @IsNotEmpty() @MaxLength(500) address!: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(2) @IsString({ each: true }) desiredJobCategories!: string[];
  @IsIn(['public', 'private']) privacy!: 'public' | 'private';
}

export class SkipGateDto {
  @IsOptional() @IsIn(['public', 'private']) privacy?: 'public' | 'private';
}
