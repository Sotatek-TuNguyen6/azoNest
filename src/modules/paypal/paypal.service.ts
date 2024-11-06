import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { DepositService } from '../deposit/deposit.service';
import { Connection, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { InvoiceService } from '../invoice/invoice.service';
import { PayPalOrder } from './interface/interface';
import { generateSecureRandomString } from 'src/utils/randomString';
import { StatusInvoice } from 'src/types/enum';
import { InjectConnection } from '@nestjs/mongoose';

@Injectable()
export class PaypalService {
  private logger = new Logger();
  constructor(
    private readonly configService: ConfigService,
    private readonly depositService: DepositService,
    private readonly userService: UsersService,
    private readonly invoiceService: InvoiceService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async generateAccessToken(
    client_id: string,
    secret: string,
  ): Promise<string> {
    try {
      const response = await axios({
        url: this.configService.get<string>('PAYPAL_BASE_URL_TOKEN'),
        method: 'post',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: 'grant_type=client_credentials',
        auth: {
          username: client_id,
          password: secret,
        },
      });
      return response.data.access_token;
    } catch (error) {
      this.logger.error('Error generating access token:', error.response.data);
      throw error;
    }
  }

  async createOrder(): Promise<string> {
    const deposit = await this.depositService.findByName('paypal');

    if (!deposit) throw new BadRequestException('Desposit not found!');
    const accessToken = await this.generateAccessToken(
      deposit.value['client_id'],
      deposit.key,
    );

    const response = await axios({
      url: process.env.PAYPAL_BASE_URL + '/v2/checkout/orders',
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + accessToken,
      },
      data: {
        intent: 'CAPTURE',
        purchase_units: [
          {
            items: [
              {
                name: 'Node.js Complete Course',
                description: 'Node.js Complete Course with Express and MongoDB',
                quantity: 1,
                unit_amount: {
                  currency_code: 'USD',
                  value: '100.00',
                },
              },
            ],
            amount: {
              currency_code: 'USD',
              value: '100.00',
              breakdown: {
                item_total: {
                  currency_code: 'USD',
                  value: '100.00',
                },
              },
            },
          },
        ],
        application_context: {
          return_url: process.env.BASE_URL + '/complete-order',
          cancel_url: process.env.BASE_URL + '/cancel-order',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          brand_name: 'manfra.io',
        },
      },
    });

    return response.data.links.find((link) => link.rel === 'approve').href;
  }

  async checkOrder(orderID: string): Promise<PayPalOrder> {
    try {
      const deposit = await this.depositService.findByName('paypal');

      // Lấy access token từ PayPal API
      const accessToken = await this.generateAccessToken(
        deposit.value['client_id'],
        deposit.key,
      );

      // Gửi yêu cầu kiểm tra đơn hàng từ PayPal API
      const response = await axios.get<PayPalOrder>(
        `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json', // Thêm Content-Type header
            Accept: 'application/json', // Thêm Accept header để định dạng phản hồi
          },
        },
      );

      // Kiểm tra mã trạng thái HTTP trả về
      if (response.status !== 200) {
        throw new BadRequestException(
          'Đơn hàng không hợp lệ hoặc chưa thanh toán',
        );
      }

      const order = response.data;

      // Kiểm tra trạng thái đơn hàng
      if (order.status !== 'COMPLETED') {
        throw new BadRequestException('Đơn hàng này chưa được thanh toán');
      }

      return order;
    } catch (error) {
      console.error('Error checking order:', error);
      throw error;
    }
  }
  async callBack(userId: Types.ObjectId, orderId: string) {
    const session = await this.connection.startSession(); // Bắt đầu session cho transaction
    session.startTransaction(); // Bắt đầu transaction

    try {
      console.log('--------start----------');
      const user = await this.userService.findOne(userId);
      const deposit = await this.depositService.findByName('paypal');

      if (!user) {
        throw new BadRequestException('User not found!');
      }

      const response = await this.checkOrder(orderId);
      const orderDetail = response.purchase_units[0];

      const checkExits = await this.invoiceService.findByTrans(response.id);
      if (checkExits) {
        throw new BadRequestException('Đơn hàng này đã được xử lý trước đó');
      }

      const amount =
        (Number(deposit.value['exchange']) ?? 23000) *
        Number(orderDetail.amount.value);

      const dataInvoice = {
        code: `PPA-${generateSecureRandomString(7)}`,
        type: 'paypal',
        status: StatusInvoice.completed,
        amount: amount,
        user_id: userId,
        currency: 'USD',
        description: `Paypal rev ${orderDetail.amount.value}$`,
        request_id: generateSecureRandomString(10),
        transaction_id: response.id, // Ghi lại transaction ID từ PayPal
      };

      // Tạo hóa đơn trong transaction
      const invoice = await this.invoiceService.create(dataInvoice, session);
      if (invoice) {
        // Thêm tiền cho người dùng trong transaction
        await this.userService.addMoneyByAdmin(userId, amount, session);
      }

      // Commit transaction khi tất cả các bước thành công
      await session.commitTransaction();
    } catch (error) {
      // Rollback transaction nếu có lỗi xảy ra
      await session.abortTransaction();
      console.error('Error processing PayPal callback:', error);
      throw error;
    } finally {
      // Kết thúc session
      session.endSession();
    }
  }
}
