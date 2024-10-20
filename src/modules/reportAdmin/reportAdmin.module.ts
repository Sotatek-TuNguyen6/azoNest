import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportAdminController } from './reportAdmin.controller';
import { ReportAdminService } from './reportAdmin.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Products, ProductsSchema } from '../products/schemas/products.schema';
import { Orders, OrdersSchema } from '../orders/schemas/orders.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Products.name, schema: ProductsSchema },
      { name: Orders.name, schema: OrdersSchema },
    ]),
  ],
  controllers: [ReportAdminController],
  providers: [ReportAdminService],
  exports: [MongooseModule, ReportAdminService],
})
export class ReportAdminModule {}
