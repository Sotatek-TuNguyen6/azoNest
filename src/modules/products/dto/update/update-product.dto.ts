import {
  IsString,
  Min,
  IsBoolean,
  MinLength,
  IsOptional,
} from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  value: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  label: string;

  @IsString()
  @IsOptional()
  icon: string;

  @IsString()
  @IsOptional()
  class: string;

  @IsString()
  @IsOptional()
  status: string;

  @IsString()
  @IsOptional()
  origin: string;

  @Min(0)
  @IsOptional()
  rate: number;

  @Min(0)
  @IsOptional()
  min: number;

  @Min(0)
  @IsOptional()
  max: number;

  @IsBoolean()
  @IsOptional()
  refill: boolean;

  @IsString()
  @IsOptional()
  description: string;
}
