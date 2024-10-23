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
import { OrderServiceInit } from './order.init';
import { Counter, CounterSchema } from './schemas/counter.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Orders.name, schema: OrdersSchema }, { name: Counter.name, schema: CounterSchema },]),
    CommonModule,
    UsersModule,
    ProductsModule,
    HistoryModule,
    PlatformsModule,
  ],
  controllers: [OrderController],
  providers: [OrderServiceInit, OrderService],
  exports: [MongooseModule, OrderService],
})
export class OrdersModule { }
