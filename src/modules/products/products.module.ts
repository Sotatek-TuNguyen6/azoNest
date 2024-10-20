import { Module } from '@nestjs/common';
import { ProductService } from './products.service';
import { ProductController } from './products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Products, ProductsSchema } from './schemas/products.schema';
import { CommonModule } from 'src/common/service/common.module';
import { CustomLoggerService } from 'src/logger/custom-logger.service';
import { LoggerModule } from 'src/logger/logger.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Products.name, schema: ProductsSchema },
    ]),
    CommonModule,
    LoggerModule,
  ],
  controllers: [ProductController],
  providers: [ProductService, CustomLoggerService],
  exports: [MongooseModule, ProductService],
})
export class ProductsModule {}
