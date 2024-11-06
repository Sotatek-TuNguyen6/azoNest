import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  HistoryLogin,
  HistoryLoginDocument,
} from './schemas/historyLogin.schema';

@Injectable()
export class HistoryLoginService {
  constructor(
    @InjectModel(HistoryLogin.name)
    private historyLoginModel: Model<HistoryLoginDocument>,
  ) {}

  async createLoginHistory(
    userId: Types.ObjectId,
    ipAddress: string,
    deviceInfo?: string,
    isSuccessful: boolean = true,
  ): Promise<HistoryLogin> {
    const loginHistory = new this.historyLoginModel({
      userId,
      loginTime: new Date(),
      ipAddress,
      deviceInfo,
      isSuccessful,
    });

    return loginHistory.save();
  }

  async findLoginHistoryByUserId(
    userId: Types.ObjectId,
  ): Promise<HistoryLogin[]> {
    return this.historyLoginModel
      .find({ userId })
      .sort({ loginTime: -1 })
      .exec();
  }

  async findLoginHistoryByIpAddress(
    ipAddress: string,
  ): Promise<HistoryLogin[]> {
    return this.historyLoginModel
      .find({ ipAddress })
      .sort({ loginTime: -1 })
      .exec();
  }

  async deleteLoginHistoryById(historyId: string): Promise<HistoryLogin> {
    return this.historyLoginModel.findByIdAndDelete(historyId).exec();
  }

  async clearAllLoginHistoryForUser(userId: string): Promise<any> {
    return this.historyLoginModel.deleteMany({ userId }).exec();
  }

  async findAll(): Promise<HistoryLogin[]> {
    return this.historyLoginModel.find();
  }
}
