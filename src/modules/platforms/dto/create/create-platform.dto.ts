import {
  IsString,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateFlatFormDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(255)
  url: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(255)
  apikey: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;
}
