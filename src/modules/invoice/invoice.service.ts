import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Invoice } from './schemas/invoice.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UsersService } from '../users/users.service';
import { generateSecureRandomString } from 'src/utils/randomString';
import { StatusInvoice } from 'src/types/enum';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    private readonly userService: UsersService
  ) { }

  async create(createInvoiceDto: CreateInvoiceDto) {
    const { user_id } = createInvoiceDto

    if (!user_id) throw new BadRequestException("User_id is require")

    const user = await this.userService.findOne(user_id)

    if (!user) throw new BadRequestException("User not found!")

    const description = createInvoiceDto.description ?? "Recharge with Perfect Money";
    const code = createInvoiceDto.code ?? `PM-${generateSecureRandomString(7)}`;
    const currency = createInvoiceDto.currency ?? "USD";

    createInvoiceDto = { ...createInvoiceDto, description, code, currency }

    const createdDeposit = new this.invoiceModel(createInvoiceDto);
    return createdDeposit.save();

  }

  findAll() {
    return `This action returns all invoice`;
  }

  findOne(id: number) {
    return `This action returns a #${id} invoice`;
  }

  update(id: number, updateInvoiceDto: UpdateInvoiceDto) {
    return `This action updates a #${id} invoice`;
  }

  remove(id: number) {
    return `This action removes a #${id} invoice`;
  }

  async findByStatus(userId: Types.ObjectId, status: StatusInvoice) {
    return await this.invoiceModel.findOne({ user_id: userId, status })
  }
}
