import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Orders } from './schemas/orders.schema';
import { ClientSession, Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  Action,
  MethodPay,
  OriginWeb,
  ResponseInforService,
  Status,
  StatusEnum,
} from 'src/types/enum';
import axios from 'axios';
import { CommonService } from 'src/common/service/common.service';
import { CommonResponse } from 'src/common/dtos/common-response.dto';
import { OrderItem } from './interface/order.interface';
import { UsersService } from '../users/users.service';
import { ProductService } from '../products/products.service';
import { User } from '../users/schemas/user.schema';
import { HistoryService } from '../history/history.service';

interface PayloadOrder {
  action: Action;
  key: string;
  orders: string;
}
@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Orders.name) private ordersModel: Model<Orders>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly configService: ConfigService,
    private readonly commonService: CommonService,
    private readonly userService: UsersService,
    private readonly productService: ProductService,
    private readonly historyService: HistoryService,

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
    } catch (error) {
      this.logger.error(error.message);
    }
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

  async deleteOrder(id: string) {
    try {
      if (!id) {
        throw new HttpException('Id is empty', HttpStatus.BAD_REQUEST);
      }

      await this.ordersModel.findByIdAndDelete(id);

      return new CommonResponse(StatusEnum.SUCCESS, 'Delete Order success!');
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

   /**
   * Create an order and deduct the total amount from the user's balance using a transaction
   * @param {OrderItem[]} orderItem - List of items in the order
   * @param {Types.ObjectId} userId - The ID of the user placing the order
   * @returns {Promise<Orders>} - The created order
   */
   async createOrder(
    orderItem: OrderItem[],
    userId: Types.ObjectId,
  ): Promise<Orders> {
    const session: ClientSession = await this.ordersModel.db.startSession(); // Bắt đầu session transaction
    session.startTransaction();

    try {
      // Tìm người dùng theo ID trong phiên giao dịch (session)
      const user = await this.userModel.findById(userId).session(session);
      if (!user) throw new NotFoundException('User ID does not exist');

      // Kiểm tra nếu danh sách sản phẩm trống
      if (!orderItem || orderItem.length === 0) {
        throw new NotFoundException('Order items cannot be empty');
      }

      const product_value = orderItem[0].service;
      const product = await this.productService.getByValue(product_value);

      // Tính tổng số tiền đơn hàng
      const totalAmount = this.calculateTotal(orderItem, product.rate);

      // Kiểm tra số dư người dùng
      if (user.money < totalAmount) {
        throw new BadRequestException('Insufficient balance');
      }

      // Trừ số tiền từ tài khoản người dùng
      user.money -= totalAmount;

      // Cập nhật số dư người dùng trong phiên giao dịch
      await user.save({ session });

      // Lưu lịch sử giao dịch với lý do trừ tiền cho đơn hàng
      await this.historyService.createHistory(
        userId.toString(),
        MethodPay.HANDLE,
        totalAmount,
        `Order placed by user ${userId}`,
      );

      // Tạo đơn hàng mới
      const newOrder = new this.ordersModel({
        userId,
        items: orderItem,
        totalAmount,
        origin: product.origin,
      });

      // Lưu đơn hàng vào cơ sở dữ liệu trong phiên giao dịch
      await newOrder.save({ session });

      // Commit transaction nếu tất cả thành công
      await session.commitTransaction();
      session.endSession();
      return newOrder;
    } catch (error) {
      // Abort transaction nếu có lỗi
      await session.abortTransaction();
      session.endSession();
      throw new InternalServerErrorException('Failed to create order');
    }
  }

  /**
   * Calculate the total amount for the order
   * @param {OrderItem[]} orderItems - The list of items in the order
   * @param {number} rate - The rate of the product
   * @returns {number} - The total amount
   */
  private calculateTotal(orderItems: OrderItem[], rate: number): number {
    return orderItems.reduce((total, item) => total + item.quantity * rate, 0);
  }
}
