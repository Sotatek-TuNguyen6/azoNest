import { IsString, IsInt, Min, Max, IsBoolean, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateProductDto {
  
  @IsString()
  @IsOptional()
  @MinLength(1)
  value: string;

  @IsString()
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

  @IsInt()
  @Min(0)
  @IsOptional()
  rate: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  min: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  max: number;

  @IsBoolean()
  @IsOptional()
  refill: boolean;
}
