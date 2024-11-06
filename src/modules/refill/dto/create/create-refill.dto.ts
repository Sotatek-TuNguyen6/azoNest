// src/refill/dto/create-refill.dto.ts
import { IsOptional, IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

export class CreateRefillDto {
  @IsOptional()
  user: Types.ObjectId;

  // @IsString()
  @IsNotEmpty()
  orderId: Types.ObjectId[];
}
