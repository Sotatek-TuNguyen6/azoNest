import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Platform, PlatformSchema } from './schemas/platform.schema';
import { PlatformsService } from './platforms.service';
import { PlatformController } from './platforms.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Platform.name, schema: PlatformSchema },
    ]),
    forwardRef(() => UsersModule), 

  ],
  controllers: [PlatformController],
  providers: [PlatformsService],
  exports: [MongooseModule, PlatformsService],
})
export class PlatformsModule {}
