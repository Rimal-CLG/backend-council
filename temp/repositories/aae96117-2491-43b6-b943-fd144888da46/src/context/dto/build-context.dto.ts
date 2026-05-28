import { IsOptional, IsString, IsArray } from 'class-validator';

export class BuildContextDto {
  @IsOptional()
  @IsString()
  framework?: string;

  @IsOptional()
  @IsString()
  database?: string;

  @IsOptional()
  @IsString()
  orm?: string;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsString()
  logs?: string;

  @IsOptional()
  @IsString()
  stackTrace?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileIds?: string[];
}
