import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './guards/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { CommonModule } from './common/service/common.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from './logger/logger.module';
import { TasksModule } from './tasks/task.module';
import { PlatformsModule } from './modules/platforms/platforms.module';
import { RedisModule } from './redis/redis.module';
import { HistoryModule } from './modules/history/history.module';
import { ReportAdminModule } from './modules/reportAdmin/reportAdmin.module';
import { ReportModule } from './modules/report/report.module';
import { ApiDocsModule } from './modules/apidocs/apidocs.module';
import { MailModule } from './modules/mail/mail.module';
import { HistoryLoginModule } from './modules/historyLogin/history-login.module';
import { RefillModule } from './modules/refill/refill.module';
import { DepositModule } from './modules/deposit/deposit.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { GlobalRateLimiterMiddleware } from './middleware/rate.middleware';
import { InvoiceModule } from './modules/invoice/invoice.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
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
    MailModule,
    RefillModule,
    InvoiceModule,
    DepositModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(GlobalRateLimiterMiddleware)
      .forRoutes('*');
  }
}

