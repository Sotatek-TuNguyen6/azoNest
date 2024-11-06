import { IsString, IsOptional, IsNumber } from 'class-validator';

export class FpaymentCallBack {
  @IsString()
  request_id: string;

  @IsString()
  token: string;

  @IsNumber()
  received: number;

  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  from_address?: string;

  @IsOptional()
  @IsString()
  transaction_id?: string;
}
