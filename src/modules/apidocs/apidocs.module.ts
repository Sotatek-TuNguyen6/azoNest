import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiDocsController } from './apidocs.controller';
import { ApiDocService } from './apidocs.service';


@Module({
  imports: [
    MongooseModule.forFeature(),
  ],
  controllers: [ApiDocsController],
  providers: [ApiDocService],
  exports: [MongooseModule, ApiDocService],
})
export class ReportModule {}
