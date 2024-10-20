import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderService } from '../orders/orders.service';
import { ProductService } from '../products/products.service';
import { OriginWeb } from 'src/types/enum';
import { Types } from 'mongoose';
import { OrderItem } from '../orders/interface/order.interface';

@Injectable()
export class ApiDocService {
  constructor(
    private readonly orderService: OrderService,
    private readonly productService: ProductService,
  ) {}

  async getProduct(origin: OriginWeb) {
    if (!origin) return new BadRequestException('Origin is require');

    return await this.productService.getByOrigin(origin);
  }

  async getStatus(orders: string[]) {
    if (!orders) return new BadRequestException('Orders is require');
    return await this.orderService.getOrders(orders);
  }

  async createOrder(
    link: string,
    quantity: number,
    service: string,
    userId: Types.ObjectId,
  ) {
    const product = await this.productService.getByValue(service);

    const orderItem: OrderItem = {
      link,
      quantity,
      service,
      name: product.label,
    };
    return this.orderService.createOrder(orderItem, userId);
  }
}
