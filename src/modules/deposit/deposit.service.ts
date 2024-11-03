import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { UpdateDepositDto } from './dto/update-deposit.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Deposit } from './schemas/deposit.schema';
import { Model, Types } from 'mongoose';
import { InvoiceService } from '../invoice/invoice.service';
import { StatusInvoice } from 'src/types/enum';
import { generateSecureRandomString } from 'src/utils/randomString';
import { CreateInvoiceDto } from '../invoice/dto/create-invoice.dto';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DepositService {
  constructor(
    @InjectModel(Deposit.name) private depositModel: Model<Deposit>,
    private readonly invoiceService: InvoiceService,
    private readonly userService: UsersService,
    private configService: ConfigService
  ) { }

  async create(createDepositDto: CreateDepositDto): Promise<Deposit> {
    const createdDeposit = new this.depositModel(createDepositDto);
    return createdDeposit.save();
  }

  findAll() {
    return `This action returns all deposit`;
  }

  async findOne(name: string, userId: Types.ObjectId) {
    let invoice = await this.invoiceService.findByStatus(userId, StatusInvoice.processing)
    const user = await this.userService.findOne(userId)

    if (invoice === null) {
      switch (name) {
        case "perfect_money":
          const data: CreateInvoiceDto = {
            code: `PM-${generateSecureRandomString(7)}`,
            type: name,
            status: StatusInvoice.processing,
            amount: 0,
            user_id: userId,
            currency: "USD",
            description: "Recharge with Perfect Money",
            request_id: generateSecureRandomString(10)
          }
          invoice = await this.invoiceService.create(data)
          break;
        default:
          throw new BadRequestException("Method not found")
      }
    }

    const result = await this.depositModel.findOne({ name }).select("-key")

    const payee_account = result.value["account_id"]
    const data = {
      "API_URL": 'https://perfectmoney.is/api/step1.asp',
      "PAYMENT_ID": invoice.request_id,
      "PAYEE_ACCOUNT": payee_account,
      "PAYEE_NAME": user.name,
      PAYMENT_UNITS: invoice.currency,
      "PAYMENT_URL": this.configService.get<string>('NODE_ENV') === "development" ? "http://localhost:3000/payment/success" : 'https://1tap.top/payment/success',
      "NOPAYMENT_URL": this.configService.get<string>('NODE_ENV') === "development" ? "http://localhost:3000/payment/failed" : 'https://1tap.top/payment/failed',
      "STATUS_URL": this.configService.get<string>('NODE_ENV') === "development" ? "http://localhost:5000/deposit/callback" : 'https://1tap.top/deposit/callback',
      "SUGGESTED_MEMO": `Payment-${invoice.code}`
    }
    return data
  }

  update(id: number, updateDepositDto: UpdateDepositDto) {
    return `This action updates a #${id} deposit`;
  }

  remove(id: number) {
    return `This action removes a #${id} deposit`;
  }

  async deleteAll() {
    return this.depositModel.deleteMany({})
  }

  async callback() {

  }
}
