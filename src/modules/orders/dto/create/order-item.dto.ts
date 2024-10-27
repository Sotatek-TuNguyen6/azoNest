import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class OrderItemDto {
  @IsNumber()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  link: string;

  @IsString()
  @IsNotEmpty()
  service: string;
}
