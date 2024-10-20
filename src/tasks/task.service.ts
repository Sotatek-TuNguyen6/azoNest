import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OrderService } from 'src/modules/orders/orders.service';
import { OriginWeb } from 'src/types/enum';

@Injectable()
export class TasksService {
  constructor(private readonly orderService: OrderService) {}
  private readonly logger = new Logger(TasksService.name);
  //   private readonly

  @Cron('*/5 * * * *')
  async handleCron() {
    await this.orderService.informationOrder(OriginWeb.AZO);
    await this.orderService.informationOrder(OriginWeb.DG1);
  }
}
