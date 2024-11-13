import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
// import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Invoice } from './schemas/invoice.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UsersService } from '../users/users.service';
import { generateSecureRandomString } from 'src/utils/randomString';
import { ChannelInvoice, StatusInvoice } from 'src/types/enum';
import { CreateInvoiceFpaymentDto } from './dto/create-invoice-fpayment';
import { Deposit } from '../deposit/schemas/deposit.schema';
import axios from 'axios';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    @InjectModel(Deposit.name) private readonly depositModel: Model<Deposit>,
    private readonly userService: UsersService,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto, session?: any) {
    const { user_id } = createInvoiceDto;

    if (!user_id) throw new BadRequestException('User_id is required');

    // Kiểm tra người dùng
    const user = await this.userService.findOne(user_id);
    if (!user) throw new BadRequestException('User not found!');

    // Thiết lập các giá trị mặc định
    const description =
      createInvoiceDto.description ?? 'Recharge with Perfect Money';
    const code = createInvoiceDto.code ?? `PM-${generateSecureRandomString(7)}`;
    const currency = createInvoiceDto.currency ?? 'USD';

    // Cập nhật lại createInvoiceDto với các giá trị mới
    createInvoiceDto = { ...createInvoiceDto, description, code, currency };

    // Tạo mới hóa đơn (invoice)
    const createdInvoice = new this.invoiceModel(createInvoiceDto);

    // Kiểm tra nếu session có tồn tại, thì lưu với session
    if (session) {
      return createdInvoice.save({ session }); // Lưu với session (trong transaction)
    }

    // Nếu không có session, lưu theo cách thông thường
    return createdInvoice.save();
  }

  findAll() {
    return `This action returns all invoice`;
  }

  findOne(id: number) {
    return `This action returns a #${id} invoice`;
  }

  async findByTrans(trans_id: string) {
    return await this.invoiceModel.findOne({ trans_id });
  }

  // update(id: number, updateInvoiceDto: UpdateInvoiceDto) {
  //   return `This action updates a #${id} invoice`;
  // }

  remove(id: number) {
    return `This action removes a #${id} invoice`;
  }

  async findByStatus(userId: Types.ObjectId, status: StatusInvoice) {
    return await this.invoiceModel.findOne({ user_id: userId, status });
  }

  async getByUser(userId: Types.ObjectId) {
    return await this.invoiceModel.find({ user_id: userId });
  }

  async getAll() {
    return await this.invoiceModel.find();
  }

  async createFpayment(data: CreateInvoiceFpaymentDto, userId: Types.ObjectId) {
    const session = await this.depositModel.db.startSession(); // Start session
    session.startTransaction();

    try {
      const { channel, amount } = data;

      switch (channel) {
        case ChannelInvoice.FPAYMENT: {
          const deposit = await this.depositModel.findOne({
            name: ChannelInvoice.FPAYMENT,
          });

          if (!deposit || !deposit.value['address_wallet']) {
            throw new BadRequestException('Chưa cấu hình ví tiền điện tử');
          }

          if (!deposit.active) {
            throw new BadRequestException(
              'Chức năng nạp tiền điện tử đang tạm bảo trì, vui lòng thử lại sau!',
            );
          }

          const pendingInvoices = await this.invoiceModel.find({
            user_id: userId,
            status: StatusInvoice.processing,
            type: 'fpayment',
          });

          if (pendingInvoices.length >= 3) {
            throw new BadRequestException(
              'Bạn đã có 3 hóa đơn đang chờ xử lý, vui lòng chờ xử lý hoặc hủy bỏ hóa đơn cũ trước khi tạo hóa đơn mới',
            );
          }

          const code = generateSecureRandomString(7);
          const requestId = generateSecureRandomString(10);

          // Make the API request to FPayment
          const response = await axios.get(
            'https://fpayment.co/api/AddInvoice.php',
            {
              params: {
                token_wallet: deposit.key,
                address_wallet: deposit.value['address_wallet'],
                name: `Deposit - ${userId}`,
                description: `order code #${code}`,
                amount: amount,
                request_id: requestId,
                callback: 'https://api.1tap.top/deposit/callbackFpayment',
                return_url: 'https://1tap.top/addfunds',
              },
            },
          );

          if (response.status !== 200) {
            throw new InternalServerErrorException(
              'Server error, please contact admin!',
            );
          }

          const result = response.data;

          if (result.status !== 'success') {
            throw new InternalServerErrorException(
              'Server error, please contact admin!',
            );
          }

          // Convert the amount based on the exchange rate
          const amountNew = Number(amount) * Number(deposit.value['exchange']);

          const paymentData = result.data;

          const dataInvoice: CreateInvoiceDto = {
            code,
            type: 'fpayment',
            status: StatusInvoice.processing,
            amount: amountNew,
            user_id: userId,
            trans_id: 'paymentData.trans_id',
            request_id: requestId,
            currency: 'USD',
            description: 'Create Invoice Fpayment',
            payment_details: {
              amount: paymentData.amount,
              trans_id: paymentData.trans_id,
              request_id: paymentData.request_id,
              url_payment: paymentData.url_payment,
            },
          };

          await this.create(dataInvoice, session);
          await session.commitTransaction();
          return paymentData.url_payment;
        }
        default:
          throw new BadRequestException('Channel not found');
      }
    } catch (error) {
      await session.abortTransaction(); // Abort transaction on error
      throw error;
    } finally {
      session.endSession();
    }
  }
}
