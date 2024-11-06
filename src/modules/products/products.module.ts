import { Module, forwardRef } from '@nestjs/common';
import { ProductService } from './products.service';
import { ProductController } from './products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Products, ProductsSchema } from './schemas/products.schema';
import { CommonModule } from 'src/common/service/common.module';
import { CustomLoggerService } from 'src/logger/custom-logger.service';
import { LoggerModule } from 'src/logger/logger.module';
import { PlatformsModule } from '../platforms/platforms.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Products.name, schema: ProductsSchema },
    ]),
    forwardRef(() => UsersModule),
    CommonModule,
    LoggerModule,
    PlatformsModule,
  ],
  controllers: [ProductController],
  providers: [ProductService, CustomLoggerService],
  exports: [MongooseModule, ProductService],
})
export class ProductsModule {}
