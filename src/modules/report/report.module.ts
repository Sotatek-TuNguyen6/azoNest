import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { Report, ReportSchema } from './schemas/report.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Report.name, schema: ReportSchema }]),
    forwardRef(() => UsersModule), 
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [MongooseModule, ReportService],
})
export class ReportModule {}
