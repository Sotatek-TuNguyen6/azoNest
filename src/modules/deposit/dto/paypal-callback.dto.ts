import {
  IsEnum,
  IsString,
  ValidateNested,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer'; // Để hỗ trợ nested validation
import { PayPalEventType } from 'src/types/enum';

// paypal-webhook.dto.ts
export class PayPalAmountDto {
  @IsString()
  @IsNotEmpty()
  currency_code: string;

  @IsString()
  @IsNotEmpty()
  value: string;
}

export class PayPalResourceDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @ValidateNested() // Để kiểm tra các trường trong object amount
  @Type(() => PayPalAmountDto) // Sử dụng class-transformer để xử lý lớp lồng nhau
  amount: PayPalAmountDto;

  @IsString()
  @IsOptional() // custom_id là optional, không phải lúc nào cũng có
  custom_id?: string; // Thêm custom_id vào đây
}

export class PayPalWebhookDto {
  @IsEnum(PayPalEventType) // Kiểm tra loại sự kiện có nằm trong enum không
  @IsNotEmpty()
  event_type: PayPalEventType;

  @ValidateNested() // Để kiểm tra các trường trong object resource
  @Type(() => PayPalResourceDto) // Sử dụng class-transformer để xử lý lớp lồng nhau
  resource: PayPalResourceDto;
}
