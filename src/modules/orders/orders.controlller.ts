import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './orders.service';
import { OrderItemDto } from './dto/create/order-item.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CustomRequest } from 'src/common/interfaces/custom-request.interface';
import { UserValidate } from 'src/guards/jwt.strategy';
import { CommonResponse } from 'src/common/dtos/common-response.dto';
import { OriginWeb, StatusEnum } from 'src/types/enum';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrder(
    @Body('orderService') orderItemDto: OrderItemDto,
    @Req() req: CustomRequest,
  ) {
    try {
      const user: UserValidate = req.user;

      await this.orderService.createOrder(orderItemDto, user.userId);
      return new CommonResponse(StatusEnum.SUCCESS, 'Created successfull');
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw new HttpException(
          {
            status: StatusEnum.ERROR,
            message: error.message,
            error: error.message,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: 'Created failed',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getOrder(@Req() req: CustomRequest) {
    try {
      const user: UserValidate = req.user;
      const result = await this.orderService.getAllOrderByUser(user.userId);
      return new CommonResponse(StatusEnum.SUCCESS, 'Get successfull', result);
    } catch (error) {
      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: 'Get failed',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/massOrder')
  async createMassOrder(
    @Req() req: CustomRequest,
    @Body('orders') orders: string,
  ) {
    try {
      const user: UserValidate = req.user;
      await this.orderService.createMany(user.userId, orders);
      return new CommonResponse(StatusEnum.SUCCESS, 'Created successfull');
    } catch (error) {
      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: error.message,
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put("/:id")
  async updateOrder(@Param('id') id: string, @Body('orderStatus') orderStatus: string) {
    try {
      const result = await this.orderService.updateOrder(id, orderStatus)

      return new CommonResponse(
        StatusEnum.SUCCESS,
        "Update Successfull"
      )
    } catch (error) {
      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: error.message,
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
