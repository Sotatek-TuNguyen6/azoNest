import { forwardRef, Module } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { DepositController } from './deposit.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Deposit, DepositSchema } from './schemas/deposit.schema';
import { UsersModule } from '../users/users.module';
import { InvoiceModule } from '../invoice/invoice.module';
import { Invoice, InvoiceSchema } from '../invoice/schemas/invoice.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Deposit.name, schema: DepositSchema },
      { name: Invoice.name, schema: InvoiceSchema },
    ]),
    forwardRef(() => UsersModule),
    forwardRef(() => InvoiceModule),
  ],
  controllers: [DepositController],
  providers: [DepositService],
  exports: [MongooseModule, DepositService],
})
export class DepositModule {}
