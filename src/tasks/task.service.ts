import { Injectable, Logger } from '@nestjs/common';
import { Cron, Interval, Timeout } from '@nestjs/schedule';
import { OrderService } from 'src/modules/orders/orders.service';
import { OriginWeb } from 'src/types/enum';

@Injectable()
export class TasksService {
  constructor(private readonly orderService: OrderService) {}
  private readonly logger = new Logger(TasksService.name);
  //   private readonly

  @Cron('*/5 * * * *')
  async handleCron() {
   await this.orderService.informationOrder(OriginWeb.AZO)
   await this.orderService.informationOrder(OriginWeb.DG1)
  }

  //   @Interval(10000)
  //   handleInterval() {
  //     this.logger.debug('Called every 10 seconds');
  //   }

  //   @Timeout(5000)
  //   handleTimeout() {
  //     this.logger.debug('Called once after 5 seconds');
  //   }
}
