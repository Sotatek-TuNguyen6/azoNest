import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Action } from 'src/types/enum';

export class ApiDocPostDto {
  @IsString()
  key: string;

  @IsString()
  action: Action;

  @IsString()
  @IsOptional()
  orders: string;

  @IsString()
  @IsOptional()
  service: string;

  @IsString()
  @IsOptional()
  link: string;

  @IsNumber()
  @IsOptional()
  quantity: number;
}
