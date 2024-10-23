import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HistoryLoginService } from './history-login.service';
import { HistoryLoginController } from './history-login.controller';
import { HistoryLogin, HistoryLoginSchema } from './schemas/historyLogin.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: HistoryLogin.name, schema: HistoryLoginSchema }]),
  ],
  controllers: [HistoryLoginController],
  providers: [HistoryLoginService],
  exports: [MongooseModule, HistoryLoginService], // If you need to use the service in other modules
})
export class HistoryLoginModule {}
