import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { ApiDocService } from './apidocs.service';
import { ApiDocPostDto } from './dto/apidocs.dto';
import { Action, OriginWeb } from 'src/types/enum';
import { UsersService } from '../users/users.service';
import { User } from '../users/interface/user.interface';
// import { CommonResponse } from 'src/common/dtos/common-response.dto';

@Controller('api/v2')
export class ApiDocsController {
  constructor(
    private readonly apiDocService: ApiDocService,
    private readonly userService: UsersService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async init(@Body() apiDocsDto: ApiDocPostDto) {
    try {
      const { action, orders, link, service, quantity, key } = apiDocsDto;

      const user: User = await this.userService.checkApiKey(key);

      switch (action) {
        case Action.services:
          const product = await this.apiDocService.getProduct(OriginWeb.AZO);
          return product;
        case Action.status:
          const orderArray = Array.isArray(orders) ? orders : [orders];

          if (!orderArray.length || orderArray.includes(undefined)) {
            return new BadRequestException('Invalid or missing orders');
          }

          const listOrders = await this.apiDocService.getStatus(orderArray);
          return listOrders;
        case Action.add:
          if (!service || !link || !quantity) {
            return new BadRequestException(
              'Missing service, link, or quantity',
            );
          }

          const createOrder = await this.apiDocService.createOrder(
            link,
            quantity,
            service,
            user._id,
          );
          return createOrder;
        default:
          throw new BadRequestException('Invalid action');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        // Xử lý lỗi yêu cầu không hợp lệ (400)
        throw error;
      } else if (error instanceof NotFoundException) {
        // Xử lý lỗi không tìm thấy (404)
        throw error;
      } else if (error instanceof ForbiddenException) {
        throw new ForbiddenException('Invalid API key');
      } else if (error.response && error.response.status === 401) {
        // Xử lý lỗi không có quyền truy cập (401)
        throw new ForbiddenException('Unauthorized request');
      } else if (error.response && error.response.status >= 500) {
        // Xử lý lỗi server từ API bên ngoài (500)
        throw new InternalServerErrorException(
          'External service error: ' + error.response.data.message,
        );
      } else {
        throw new InternalServerErrorException('An unexpected error occurred');
      }
    }
  }
}
