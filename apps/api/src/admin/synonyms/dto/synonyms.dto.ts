import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class SaveSynonymGroupDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsNotEmpty({ message: "กรุณาระบุ Main Keyword" })
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsArray()
  @IsString({ each: true })
  synonyms!: string[];

  @IsOptional()
  @IsBoolean()
  autoAiGenerated?: boolean;
}

export class QuerySynonymsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class AiSuggestDto {
  @IsNotEmpty({ message: "กรุณาระบุ keyword สำหรับให้ AI แนะนำ" })
  @IsString()
  keyword!: string;
}
