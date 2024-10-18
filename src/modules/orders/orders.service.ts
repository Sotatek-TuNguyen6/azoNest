import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Orders } from './schemas/orders.schema';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  Action,
  OriginWeb,
  ResponseInforService,
  Status,
  StatusEnum,
} from 'src/types/enum';
import axios from 'axios';
import { CommonService } from 'src/common/service/common.service';
import { CommonResponse } from 'src/common/dtos/common-response.dto';
import { OrderItem } from './interface/order.interface';
import { User } from '../users/interface/user.interface';
import { UsersService } from '../users/users.service';

interface PayloadOrder {
  action: Action;
  key: string;
  orders: string;
}
@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Orders.name) private ordersModel: Model<Orders>,
    private readonly configService: ConfigService,
    private readonly commonService: CommonService,
    private readonly userService: UsersService
  ) {}
  private readonly logger = new Logger(OrderService.name);

  async informationOrder(origin: OriginWeb) {
    try {
      const getService = await this.ordersModel.find({
        origin: origin,
        orderStatus: { $nin: ['Hoàn thành', 'Tạm dừng'] },
      });
      if (getService && getService.length > 0) {
        const listOrder = getService.map((item) => item.orderItems[0].order);

        let payload: PayloadOrder;
        switch (origin) {
          case OriginWeb.AZO:
            payload = {
              action: Action.status,
              key: this.configService.get<string>('AZO_KEY'),
              orders: listOrder.toString(),
            };
            break;
          case OriginWeb.DG1:
            payload = {
              action: Action.status,
              key: this.configService.get<string>('DG1_KEY'),
              orders: listOrder.toString(),
            };
            break;
          default:
            throw new HttpException(
              'Unsupported origin',
              HttpStatus.BAD_REQUEST,
            );
        }
        const urlEncodedData = new URLSearchParams();
        urlEncodedData.append('key', payload.key);
        urlEncodedData.append('action', payload.action);
        urlEncodedData.append('orders', payload.orders);

        const url = this.commonService.getUrlByOrigin(origin);
        const response = await axios.post(url, urlEncodedData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
        const responseData = response.data;

        for (const orderId in responseData) {
          const orderStatus: ResponseInforService = responseData[orderId];

          if (orderStatus.error) {
            console.log(
              `Order ID ${orderId} has an error: ${orderStatus.error}`,
            );
            continue;
          }

          await this.ordersModel.findOneAndUpdate(
            { 'orderItems.order': orderId },
            {
              $set: {
                charge: orderStatus.charge,
                start_count: orderStatus.start_count,
                orderStatus: Status[orderStatus.status],
                remains: orderStatus.remains,
              },
            },
            { new: true },
          );

          this.logger.log('Update sucess!!');
        }
      } else {
        this.logger.log('Không có bản ghi nào!');
      }
    } catch (error) {}
  }

  async retryOrder(
    origin: OriginWeb,
    id: string,
  ): Promise<CommonResponse<any>> {
    try {
      const order = await this.ordersModel.findById({
        id,
      });

      if (!order) {
        this.logger.log('Order not found');
        throw new HttpException('Order not found', HttpStatus.BAD_REQUEST);
      }

      let payload: PayloadOrder;
      switch (origin) {
        case OriginWeb.AZO:
          payload = {
            action: Action.status,
            key: this.configService.get<string>('AZO_KEY'),
            orders: order.orderItems[0].order.toString(),
          };
          break;
        case OriginWeb.DG1:
          payload = {
            action: Action.status,
            key: this.configService.get<string>('DG1_KEY'),
            orders: order.orderItems[0].order.toString(),
          };
          break;
        default:
          throw new HttpException('Unsupported origin', HttpStatus.BAD_REQUEST);
      }

      const urlEncodedData = new URLSearchParams();
      urlEncodedData.append('key', payload.key);
      urlEncodedData.append('action', payload.action);
      urlEncodedData.append('orders', payload.orders);

      const url = this.commonService.getUrlByOrigin(origin);
      const response = await axios.post(url, urlEncodedData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      const responseData: ResponseInforService = response.data;
      if (responseData) {
        await this.ordersModel.findOneAndUpdate(
          { 'orderItems.order': order.orderItems[0].order.toString() },
          {
            $set: {
              charge: responseData.charge,
              start_count: responseData.start_count,
              orderStatus: Status[responseData.status],
              remains: responseData.remains,
            },
          },
          { new: true },
        );

        this.logger.log('Update sucess!!');
        return new CommonResponse(
          StatusEnum.SUCCESS,
          'Retry order successfully',
        );
      } else {
        return new CommonResponse(StatusEnum.FAIL, 'Retry order fail');
      }
    } catch (error) {
      this.logger.error('Fail Retry!!');

      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: 'Failed to retry order',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateOrder(id: string, orderStatus: string, origin: OriginWeb) {
    try {
      if (!id) {
        throw new HttpException('Id is empty', HttpStatus.BAD_REQUEST);
      }

      const order = await this.ordersModel.findByIdAndUpdate(
        id,
        {
          origin,
          orderStatus,
        },
        { new: true },
      );

      if (order) {
        this.logger.log('Update success!!!');
        return new CommonResponse(StatusEnum.SUCCESS, 'Update success', order);
      }
    } catch (error) {
      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: 'Failed to update order',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteOrder(id: string){
    try {
      if (!id) {
        throw new HttpException('Id is empty', HttpStatus.BAD_REQUEST);
      }

      await this.ordersModel.findByIdAndDelete(id)

      return new CommonResponse(StatusEnum.SUCCESS, "Delete Order success!")
    } catch (error) {
      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: 'Failed to update order',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createOrder (orderItem: OrderItem[], userId: Types.ObjectId){
    try {
      const user = await this.userService.findOne(userId)
      console.log("🚀 ~ OrderService ~ createOrder ~ user:", user)
      
    } catch (error) {
      
    }
  }

}
