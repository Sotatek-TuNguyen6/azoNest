import { Module } from '@nestjs/common';
import { TasksService } from './task.service';
import { OrdersModule } from 'src/modules/orders/orders.module';

@Module({
  imports: [OrdersModule],
  providers: [TasksService],
})
export class TasksModule {}
