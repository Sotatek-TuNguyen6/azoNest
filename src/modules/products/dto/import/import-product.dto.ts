import { IsEnum } from 'class-validator';
import { OriginWeb } from 'src/types/enum';

export class ImportProductDto {
  @IsEnum(OriginWeb, { message: 'Invalid origin' })
  origin: OriginWeb;
}
