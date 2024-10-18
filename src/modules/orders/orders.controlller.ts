import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { OrderService } from './orders.service';
import { OrderItemDto } from './dto/create/order-item.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CustomRequest } from 'src/common/interfaces/custom-request.interface';
import { UserValidate } from 'src/guards/jwt.strategy';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrder(
    @Body('orderService') orderItemDto: OrderItemDto[],
    @Req() req: CustomRequest,
  ) {
    const user:UserValidate = req.user;

    this.orderService.createOrder(orderItemDto, user.userId);
  }
}
