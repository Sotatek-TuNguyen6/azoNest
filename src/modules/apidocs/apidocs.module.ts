import { Module } from '@nestjs/common';
import { ApiDocsController } from './apidocs.controller';
import { ApiDocService } from './apidocs.service';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [
    // MongooseModule.forFeature(),
    UsersModule,
    ProductsModule,
    HistoryModule,
    OrdersModule,
  ],
  controllers: [ApiDocsController],
  providers: [ApiDocService],
  exports: [ApiDocService],
})
export class ApiDocsModule {}
