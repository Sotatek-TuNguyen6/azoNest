import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { History, HistorySchema } from './schemas/history.schema';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: History.name, schema: HistorySchema }]),
    forwardRef(() => UsersModule),
  ],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [MongooseModule, HistoryService],
})
export class HistoryModule {}
