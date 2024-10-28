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
import { Orders, OrdersDocument } from './schemas/orders.schema';
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
import { ProductService } from '../products/products.service';
import { User } from '../users/schemas/user.schema';
import { HistoryService } from '../history/history.service';
import { PlatformsService } from '../platforms/platforms.service';
import { use } from 'passport';


interface PayloadOrder {
  action: Action;
  key: string;
  orders?: string;
  link?: string;
  quantity?: number;
  service?: string;
}

export interface ResponseOrderStatus {
  charge: number;
  start_count: number;
  status: string;
  remains: number;
}

export interface ResponseCreateOrder {
  order: string
}

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Orders.name) private ordersModel: Model<Orders>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly configService: ConfigService,
    private readonly commonService: CommonService,
    private readonly platFromService: PlatformsService,
    private readonly productService: ProductService,
    private readonly historyService: HistoryService,
  ) { }
  private readonly logger = new Logger(OrderService.name);

  async sendOrder(url: string, key: string, orderItem: OrderItem): Promise<ResponseCreateOrder> {
    try {
      const payload: PayloadOrder = {
        action: Action.add,
        service: orderItem.service,
        link: orderItem.link,
        quantity: orderItem.quantity,
        key
      };

      const urlEncodedData = new URLSearchParams();
      urlEncodedData.append('key', payload.key);
      urlEncodedData.append('action', payload.action);
      urlEncodedData.append('service', payload.service);
      urlEncodedData.append('link', payload.link);
      urlEncodedData.append('quantity', payload.quantity.toString());

      const response = await axios.post(url, urlEncodedData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.data || !response.data.order)
        throw new Error('Create order fail');

      const responseData = response.data;
      return responseData
    } catch (error) {
      this.logger.error(error)
      throw error
    }
  }

  async informationOrder(origin: OriginWeb) {
    try {
      const getService = await this.ordersModel.find({
        origin: origin,
        orderStatus: { $nin: ['Hoàn thành', 'Tạm dừng'] },
      });
      if (getService && getService.length > 0) {
        const listOrder = getService.map((item) => item.orderItems.order);

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
            orders: order.orderItems.order.toString(),
          };
          break;
        case OriginWeb.DG1:
          payload = {
            action: Action.status,
            key: this.configService.get<string>('DG1_KEY'),
            orders: order.orderItems.order.toString(),
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
          { 'orderItems.order': order.orderItems.order.toString() },
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
    orderItem: OrderItem,
    userId: Types.ObjectId,
  ): Promise<boolean> {
    const session: ClientSession = await this.ordersModel.db.startSession(); // Bắt đầu session transaction
    session.startTransaction();

    try {
      // Tìm người dùng theo ID trong phiên giao dịch (session)
      const user = await this.userModel.findById(userId).session(session);
      if (!user) throw new NotFoundException('User ID does not exist');

      // Kiểm tra nếu danh sách sản phẩm trống
      if (!orderItem) {
        throw new NotFoundException('Order items cannot be empty');
      }

      const product_value = orderItem.service;
      const product = await this.productService.getByValue(product_value);
      if (!product) throw new BadRequestException("Product not found");
      const platform = product.originPlatform;

      // Tính tổng số tiền đơn hàng
      const totalAmount = this.calculateTotal(orderItem, product.rate);

      // Kiểm tra số dư người dùng
      if (user.money < totalAmount) {
        throw new BadRequestException('Insufficient balance');
      }

      const findPlatform = await this.platFromService.getById(platform);
      if (!findPlatform) throw new BadRequestException("Platform not found");

      const url = findPlatform.url;

      const result = await this.sendOrder(url, findPlatform.apikey, orderItem)
      orderItem = { ...orderItem, order: result.order, name: product.label };
      const moneyOld = user.money
      // Trừ số tiền từ tài khoản người dùng
      user.money -= totalAmount;

      // Cập nhật số dư người dùng trong phiên giao dịch
      await user.save({ session });

      // Lưu lịch sử giao dịch với lý do trừ tiền cho đơn hàng
      await this.historyService.createHistory(
        userId.toString(),
        MethodPay.HANDLE,
        totalAmount,
        moneyOld,
        `Add order - ${result.order}`,
      );

      // Tạo đơn hàng mới
      const newOrder = new this.ordersModel({
        user: userId,
        orderItems: orderItem,
        totalAmount,
        origin: product.origin,
      });

      // Lưu đơn hàng vào cơ sở dữ liệu trong phiên giao dịch
      await newOrder.save({ session });

      // Commit transaction nếu tất cả thành công
      await session.commitTransaction();
      session.endSession();
      return true;
    } catch (error) {
      // Abort transaction nếu có lỗi
      console.log('🚀 ~ OrderService ~ error:', error);
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
  private calculateTotal(orderItems: OrderItem[] | OrderItem, rate: number): number {
    if (Array.isArray(orderItems)) {
      return orderItems.reduce((total, item) => total + item.quantity * rate, 0);
    } else {
      return orderItems.quantity * rate;
    }
  }

  async getOrders(ordersId: string[]): Promise<ResponseOrderStatus> {
    try {
      const orders = await this.ordersModel
        .find({ 'orderItems.order': { $in: ordersId } })
        .select('charge start_count orderStatus remains')
        .exec();

      if (orders.length === 1) {
        const singleOrder = orders[0];
        return {
          charge: singleOrder.charge,
          start_count: singleOrder.start_count,
          status: singleOrder.orderStatus,
          remains: singleOrder.remains,
        };
      }

      const ordersObj = {};
      orders.forEach((order) => {
        ordersObj[order.orderItems.order] = {
          charge: order.charge,
          start_count: order.start_count,
          status: order.orderStatus, // Đổi tên orderStatus thành status
          remains: order.remains,
        };
      });
    } catch (error) {
      console.log('🚀 ~ OrderService ~ getOrders ~ error:', error);
      throw new InternalServerErrorException('Failed to get orders');
    }
  }

  // async getAllOrderByUser(userId: Types.ObjectId): Promise<Orders[]> {
  //   return await this.ordersModel
  //     .find({ user: userId })
  //     // .populate({
  //     //   path: 'orderItems.service', // Đường dẫn tới field `service` trong `orderItems`
  //     //   model: 'Products', // Model tham chiếu là `Product`
  //     // });
  // }

  async getAllOrderByUser(userId: Types.ObjectId) {
    const products = await this.productService.getAll();

    const productDict = products.reduce((acc, product) => {
      acc[product.value] = product;
      return acc;
    }, {} as Record<string, typeof products[0]>);
    this.logger.debug(productDict)
    const orders = await this.ordersModel.find({ user: userId }).lean();

    type OrderItemWithProduct = OrderItem & { badges?: string[] };


    return orders.map((order) => {
      const updatedOrderItems: OrderItemWithProduct = {
        ...order.orderItems,
        badges: productDict[order.orderItems.service].badges || null,
      };
     
      return {
        ...order,
        orderItems: updatedOrderItems,
      };
    });
  }


  async createMany(userId: Types.ObjectId, orders: string) {
    if (!orders) throw new BadRequestException("Orders are required");

    const session: ClientSession = await this.ordersModel.db.startSession();
    session.startTransaction();

    try {
      // Lấy thông tin người dùng
      const user = await this.userModel.findById(userId).session(session);
      if (!user) throw new BadRequestException("User ID does not exist");

      // Lấy tất cả các sản phẩm
      const products = await this.productService.getAll();

      const allOrderItems: OrderItem[] = [];
      const totalAmounts: number[] = [];
      const firstStep = orders.split("\n");
      const arrayLink: string[] = []
      const arrayKey: string[] = []

      for (const item of firstStep) {
        const parts = item.split("|").map((part) => part.trim());

        if (parts.length < 3) {
          throw new BadRequestException("Each order line must have at least service_id, link, and quantity");
        }

        const [serviceId, link, quantityStr] = parts;
        if (!/^\d+$/.test(quantityStr)) {
          throw new BadRequestException("Quantity must be a valid number");
        }
        const quantity = parseInt(quantityStr, 10);

        // Tìm sản phẩm với serviceId tương ứng
        const product = products.find((prod) => prod.value === serviceId);
        if (!product) throw new BadRequestException("Product not found");

        const platForm = await this.platFromService.getById(product.originPlatform);
        if (!platForm) throw new BadRequestException("Platform not found");

        arrayLink.push(platForm.url);
        arrayKey.push(platForm.apikey);
        const itemTotal = quantity * product.rate;
        totalAmounts.push(itemTotal);

        const orderItems: OrderItem = {
          service: serviceId,
          link,
          quantity,
          name: product.label,
        };

        allOrderItems.push(orderItems);
      }

      const totalAmount = totalAmounts.reduce((sum, amount) => sum + amount, 0);

      if (user.money < totalAmount) {
        throw new BadRequestException("Insufficient balance");
      }
      const moneyOld = user.money
      user.money -= totalAmount;
      await user.save({ session });
      // Tạo và lưu tất cả các đơn hàng
      const orderPromises = [];
      for (const [index, orderItems] of allOrderItems.entries()) {
        // Gọi hàm sendOrder và chờ kết quả
        // const result = await this.sendOrder(arrayLink[index], arrayKey[index], orderItems);

        // Cập nhật orderItems với thông tin mới
        const updatedOrderItems = { ...orderItems, order: index };

        await this.historyService.createHistory(
          userId.toString(),
          MethodPay.HANDLE,
          totalAmount,
          moneyOld,
          `Add order - ${index}`,
        );

        // Tạo đối tượng đơn hàng mới
        const newOrder = new this.ordersModel({
          user: userId,
          orderItems: updatedOrderItems,
          totalAmount: totalAmounts[index],
          status: "Pending",
        });

        // Lưu lời hứa (promise) vào  orderPromises
        orderPromises.push(newOrder.save({ session }));
      }

      await Promise.all(orderPromises);

      await session.commitTransaction();
      session.endSession();
      this.logger.debug("Multiple orders created successfully");

      return true;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      this.logger.error("Transaction failed:", error);
      throw error;
    }
  }
}
