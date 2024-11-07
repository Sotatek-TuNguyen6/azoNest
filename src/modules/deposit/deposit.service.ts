import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Deposit } from './schemas/deposit.schema';
import { Model, Types } from 'mongoose';
import { InvoiceService } from '../invoice/invoice.service';
import { PayPalEventType, StatusInvoice } from 'src/types/enum';
import { generateSecureRandomString } from 'src/utils/randomString';
import { CreateInvoiceDto } from '../invoice/dto/create-invoice.dto';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { PayPalWebhookDto } from './dto/paypal-callback.dto';
import { FpaymentCallBack } from './dto/fpayment-callback.dto';
import { Invoice } from '../invoice/schemas/invoice.schema';
import { UpdateDepositDto } from './dto/update-deposit.dto';

@Injectable()
export class DepositService {
  constructor(
    @InjectModel(Deposit.name) private depositModel: Model<Deposit>,
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    private readonly invoiceService: InvoiceService,
    private readonly userService: UsersService,
    private configService: ConfigService,
  ) {}

  async create(createDepositDto: CreateDepositDto): Promise<Deposit> {
    const createdDeposit = new this.depositModel(createDepositDto);
    return createdDeposit.save();
  }

  async findAll() {
    return await this.depositModel.find();
  }

  async findOne(name: string, userId: Types.ObjectId) {
    if (name === 'paypal' || name === 'cryptocurrency') return;
    let invoice = await this.invoiceService.findByStatus(
      userId,
      StatusInvoice.processing,
    );
    const user = await this.userService.findOne(userId);

    if (invoice === null) {
      switch (name) {
        case 'perfect_money': {
          const data: CreateInvoiceDto = {
            code: `PM-${generateSecureRandomString(7)}`,
            type: name,
            status: StatusInvoice.processing,
            amount: 0,
            user_id: userId,
            currency: 'USD',
            description: 'Recharge with Perfect Money',
            request_id: generateSecureRandomString(10),
          };
          invoice = await this.invoiceService.create(data);
          break;
        }
        default:
          throw new BadRequestException('Method not found');
      }
    }

    const result = await this.depositModel.findOne({ name }).select('-key');

    const payee_account =
      name === 'perfect_money'
        ? result.value['account_id']
        : result.value['client_id'];

    const data = {
      API_URL:
        name === 'perfect_money' ? 'https://perfectmoney.is/api/step1.asp' : '',
      PAYMENT_ID: invoice?.request_id ?? '',
      PAYEE_ACCOUNT: payee_account,
      PAYEE_NAME: user.name,
      PAYMENT_UNITS: invoice?.currency ?? 'USD',
      PAYMENT_URL:
        this.configService.get<string>('NODE_ENV') === 'development'
          ? 'http://localhost:3000/payment/success'
          : 'https://1tap.top/payment/success',
      NOPAYMENT_URL:
        this.configService.get<string>('NODE_ENV') === 'development'
          ? 'http://localhost:3000/payment/failed'
          : 'https://1tap.top/payment/failed',
      STATUS_URL:
        this.configService.get<string>('NODE_ENV') === 'development'
          ? 'http://localhost:5000/deposit/callback'
          : 'https://1tap.top/deposit/callback',
      SUGGESTED_MEMO: `Payment-${invoice?.code ?? ''}`,
    };
    return data;
  }

  async update(id: Types.ObjectId, updateDepositDto: UpdateDepositDto): Promise<Deposit> {
    const updatedDeposit = await this.depositModel
      .findByIdAndUpdate(id, updateDepositDto, { new: true, runValidators: true })
      .exec();
      
    if (!updatedDeposit) {
      throw new BadRequestException(`Deposit with ID ${id} not found`);
    }
    
    return updatedDeposit;
  }

  remove(id: number) {
    return `This action removes a #${id} deposit`;
  }

  async deleteAll() {
    return this.depositModel.deleteMany({});
  }

  async callbackPaypal(data: PayPalWebhookDto) {
    const session = await this.depositModel.db.startSession(); // Khởi tạo session
    session.startTransaction();
    try {
      const result = await this.depositModel
        .findOne({ name: 'paypal' })
        .select('-key')
        .session(session);
      switch (data.event_type) {
        case PayPalEventType.PAYMENT_CAPTURE_COMPLETED:
          const paymentDetails = data.resource;
          const userId = paymentDetails.custom_id.slice(7);
          const amount =
            result.value['exchange'] * Number(paymentDetails.amount.value);

          const dataCreate: CreateInvoiceDto = {
            code: `PPA-${generateSecureRandomString(7)}`,
            type: 'paypal',
            status: StatusInvoice.completed,
            amount: amount,
            user_id: userId,
            currency: 'USD',
            description: 'Recharge with Paypal',
            request_id: generateSecureRandomString(10),
          };
          const invoice = await this.invoiceService.create(dataCreate, session);
          if (invoice) {
            await this.userService.addMoneyByAdmin(userId, amount, session);
          }
          break;

        case PayPalEventType.PAYMENT_CAPTURE_DECLINED:
        case PayPalEventType.PAYMENT_CAPTURE_DENIED:
        case PayPalEventType.PAYMENT_CAPTURE_REFUNDED:
          const orderDetails = data.resource;
          console.log('Đơn hàng bị hủy:', orderDetails);
          // Xử lý đơn hàng bị hủy
          break;

        default:
          console.log('Sự kiện không xử lý:', data.event_type);
          break;
      }
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    }
  }

  async callbackFpayment(data: FpaymentCallBack) {
    const session = await this.depositModel.db.startSession();
    session.startTransaction();
    try {
      const { transaction_id, received, request_id } = data;

      const invoice = await this.invoiceModel.findOne({
        request_id,
        status: StatusInvoice.processing,
      });

      if (!invoice) {
        throw new BadRequestException('Invoice not found');
      }

      const userId = invoice.user_id;

      const userCheck = await this.userService.findOne(userId);
      if (!userCheck) {
        invoice.status = StatusInvoice.cancelled;
        invoice.description = 'User not found';
        await invoice.save();
        throw new BadRequestException('Usert not found!');
      }

      if (data.status === StatusInvoice.completed) {
        const realAmount = invoice.amount;

        invoice.status = StatusInvoice.completed;
        invoice.description = `Deposit FPayment - ${transaction_id} - Rev ${received}`;
        await invoice.save();

        await this.userService.addMoneyByAdmin(userId, realAmount, session);
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    }
  }

  async findByName(name: string): Promise<Deposit> {
    return await this.depositModel.findOne({ name });
  }
}
