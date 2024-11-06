import { forwardRef, Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Invoice, InvoiceSchema } from './schemas/invoice.schema';
import { UsersModule } from '../users/users.module';
import { Deposit, DepositSchema } from '../deposit/schemas/deposit.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Deposit.name, schema: DepositSchema },
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService],
  exports: [MongooseModule, InvoiceService],
})
export class InvoiceModule {}
