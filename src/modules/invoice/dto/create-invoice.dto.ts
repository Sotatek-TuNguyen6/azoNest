// create-invoice.dto.ts
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsMongoId,
} from 'class-validator';
import { StatusInvoice } from 'src/types/enum';
import { Types } from 'mongoose';

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsEnum(StatusInvoice)
  @IsOptional() // Optional because we set a default value
  status?: StatusInvoice;

  @IsNumber()
  @IsOptional() // Optional because we set a default value
  amount?: number;

  @IsMongoId()
  @IsNotEmpty()
  user_id: Types.ObjectId | string;

  @IsString()
  @IsOptional() // Optional because we set a default value
  currency?: string;

  @IsString()
  @IsOptional() // Optional if request_id is not always present
  request_id?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  trans_id?: string;

  @IsOptional()
  @IsObject()
  payment_details?: Record<string, any>;
}
