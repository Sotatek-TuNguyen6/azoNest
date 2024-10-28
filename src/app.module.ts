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
import { PlatformsModule } from './modules/platforms/platforms.module';
import { PlatformController } from './modules/platforms/platforms.controller';
import { PlatformsService } from './modules/platforms/platforms.service';
import { RedisModule } from './redis/redis.module';
import { HistoryModule } from './modules/history/history.module';
import { HistoryService } from './modules/history/history.service';
import { HistoryController } from './modules/history/history.controller';
import { ReportAdminModule } from './modules/reportAdmin/reportAdmin.module';
import { ReportModule } from './modules/report/report.module';
import { ReportAdminController } from './modules/reportAdmin/reportAdmin.controller';
import { ReportController } from './modules/report/report.controller';
import { ReportService } from './modules/report/report.service';
import { ReportAdminService } from './modules/reportAdmin/reportAdmin.service';
import { ApiDocsModule } from './modules/apidocs/apidocs.module';
import { ApiDocsController } from './modules/apidocs/apidocs.controller';
import { ApiDocService } from './modules/apidocs/apidocs.service';
import { MailModule } from './modules/mail/mail.module';
import { HistoryLoginModule } from './modules/historyLogin/history-login.module';
import { HistoryLoginController } from './modules/historyLogin/history-login.controller';
import { HistoryLoginService } from './modules/historyLogin/history-login.service';

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
    PlatformsModule,
    HistoryModule,
    TasksModule,
    ReportAdminModule,
    ReportModule,
    ApiDocsModule,
    RedisModule,
    HistoryLoginModule,
    MailModule
  ],
  controllers: [
    AppController,
    UsersController,
    ProductController,
    OrderController,
    PlatformController,
    HistoryController,
    ReportAdminController,
    ReportController,
    ApiDocsController,
    HistoryLoginController
  ],
  providers: [
    AppService,
    UsersService,
    ProductService,
    OrderService,
    CustomLoggerService,
    TasksService,
    PlatformsService,
    HistoryService,
    ReportService,
    ReportAdminService,
    ApiDocService,
    HistoryLoginService
  ],
})
export class AppModule {}

