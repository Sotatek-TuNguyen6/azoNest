// create-invoice.dto.ts
import { IsNumber, IsString, IsOptional } from 'class-validator';
import { ChannelInvoice } from 'src/types/enum';


export class CreateInvoiceFpaymentDto {
    @IsString()
    amount: string;

    @IsString()
    @IsOptional()
    channel: ChannelInvoice
}
