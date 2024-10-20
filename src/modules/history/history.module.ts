import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { History, HistorySchema } from './schemas/history.schema';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: History.name, schema: HistorySchema }]),
  ],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [MongooseModule, HistoryService],
})
export class HistoryModule {}
