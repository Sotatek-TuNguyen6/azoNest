import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Orders, OrdersSchema } from './schemas/orders.schema';
import { OrderService } from './orders.service';
import { OrderController } from './orders.controlller';
import { CommonModule } from 'src/common/service/common.module';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { HistoryModule } from '../history/history.module';
import { PlatformsModule } from '../platforms/platforms.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Orders.name, schema: OrdersSchema }]),
    CommonModule,
    UsersModule,
    ProductsModule,
    HistoryModule,
    PlatformsModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [MongooseModule, OrderService],
})
export class OrdersModule {}
