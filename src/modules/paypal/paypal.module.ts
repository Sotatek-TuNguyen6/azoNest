import { forwardRef, Module } from '@nestjs/common';
import { PaypalService } from './paypal.service';
import { PaypalController } from './paypal.controller';
import { DepositModule } from '../deposit/deposit.module';
import { UsersModule } from '../users/users.module';
import { InvoiceModule } from '../invoice/invoice.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule,
    DepositModule,
    forwardRef(() => UsersModule),
    InvoiceModule,
  ],
  controllers: [PaypalController],
  providers: [PaypalService],
  exports: [PaypalService],
})
export class PaypalModule {}
