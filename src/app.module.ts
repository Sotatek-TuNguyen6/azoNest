import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersController } from './modules/users/users.controller';
import { UsersService } from './modules/users/users.service';
import { AuthModule } from './guards/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { ProductService } from './modules/products/products.service';
import { ProductController } from './modules/products/products.controller';
import { CommonModule } from './common/service/common.module';
import { OrdersModule } from './modules/orders/orders.module';
import { OrderController } from './modules/orders/orders.controlller';
import { OrderService } from './modules/orders/orders.service';
import { ScheduleModule } from '@nestjs/schedule';
import { CustomLoggerService } from './logger/custom-logger.service';
import { LoggerModule } from './logger/logger.module';
import { TasksModule } from './tasks/task.module';
import { TasksService } from './tasks/task.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'), 
      }),
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    ProductsModule,
    OrdersModule,
    CommonModule,
    LoggerModule,
    OrdersModule,
    TasksModule
  ],
  controllers: [AppController, UsersController, ProductController, OrderController],
  providers: [AppService, UsersService, ProductService, OrderService, CustomLoggerService, TasksService],
})
export class AppModule {}
