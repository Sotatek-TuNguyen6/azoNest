import { IsEnum, IsNumber, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { OriginWeb } from 'src/types/enum';

export class ImportProductDto {
  @IsEnum(OriginWeb, { message: 'Invalid origin' })
  origin: OriginWeb;

  @IsString()
  platform: Types.ObjectId;

  @IsNumber()
  percent: number
}
