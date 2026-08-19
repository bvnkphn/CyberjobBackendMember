import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class SaveGateDto {
  @IsString() @IsNotEmpty() @MaxLength(120)
  firstName!: string;

  @IsString() @IsNotEmpty() @MaxLength(120)
  lastName!: string;

  @IsString() @IsNotEmpty() @MaxLength(2000)
  address!: string;

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(2) @IsString({ each: true })
  desiredJobCategories!: string[];

  @IsIn(["public", "private"])
  privacy!: "public" | "private";
}

export class UpdateProfileSectionDto {
  @IsObject()
  data!: Record<string, unknown>;
}

export class SkipGateDto {
  @IsOptional() @IsIn(["public", "private"])
  privacy?: "public" | "private";
}
