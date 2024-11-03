// create-deposit.dto.ts
import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateDepositDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsObject()  
  value?: Record<string, any>;
}
