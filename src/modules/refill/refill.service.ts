import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Refill } from './schemas/refill.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateRefillDto } from './dto/create/create-refill.dto';
import { UsersService } from '../users/users.service';
import { OrderService } from '../orders/orders.service';

@Injectable()
export class RefillService {
  constructor(
    @InjectModel(Refill.name) private historyModel: Model<Refill>,
    private readonly userModule: UsersService,
    private readonly orderModule: OrderService,
  ) {}
  private readonly logger = new Logger(Refill.name);
  // Create a new refill record
  async createRefill(
    userId: Types.ObjectId,
    data: CreateRefillDto,
  ): Promise<Refill[]> {
    const { orderId } = data;
    this.logger.debug(orderId);

    const userCheck = await this.userModule.findOne(userId);
    if (!userCheck) throw new BadRequestException('User not found');

    const orderCheck = await this.orderModule.getDetail(orderId);
    if (!orderCheck || orderCheck.length !== orderId.length)
      throw new BadRequestException('Order not found');

    const refillRecords: Refill[] = [];

    for (const [index] of orderId.entries()) {
      const newRefill = new this.historyModel({
        ...data,
        user: userId,
        orderId: orderCheck[index]._id,
      });
      const savedRefill = await newRefill.save();
      refillRecords.push(savedRefill);
    }

    return refillRecords;
  }

  // Get all refill records
  async getAllRefills(): Promise<Refill[]> {
    return this.historyModel.find().exec();
  }

  // Get a specific refill record by ID
  async getRefillById(id: string): Promise<Refill> {
    return this.historyModel.findById(id).exec();
  }

  // Update a refill record by ID
  async updateRefill(id: string, data: Partial<Refill>): Promise<Refill> {
    return this.historyModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  // Delete a refill record by ID
  async deleteRefill(id: string): Promise<Refill> {
    return this.historyModel.findByIdAndDelete(id).exec();
  }

  async getRefillByUser(userId: Types.ObjectId) {
    return await this.historyModel.find({ user: userId });
  }
}
