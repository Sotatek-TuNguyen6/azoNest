import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Refill, RefillSchema } from './schemas/refill.schema';
import { RefillController } from './refill.controller';
import { RefillService } from './refill.service';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Refill.name, schema: RefillSchema }]),
        UsersModule,
        OrdersModule
    ],
    controllers: [RefillController],
    providers: [RefillService],
    exports: [MongooseModule, RefillService],
})
export class RefillModule { }
