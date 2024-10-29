import { Injectable } from '@nestjs/common';
import { History } from './schemas/history.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { MethodPay, TypeHistory } from 'src/types/enum';

@Injectable()
export class HistoryService {
  constructor(
    @InjectModel(History.name) private historyModel: Model<History>,
  ) { }

  /**
   * Create a new history record for a user transaction.
   *
   * @param {string} userId - The ID of the user performing the transaction.
   * @param {MethodPay} method - The payment method used in the transaction (e.g., CASH, CREDIT_CARD).
   * @param {number} amount - The amount of money involved in the transaction.
   * @param {string} description - A description of the transaction.
   * @returns {Promise<History>} - The created History document.
   *
   * @example
   * const history = await this.historyService.createHistory('123456', MethodPay.CREDIT_CARD, 500, 'Payment for order #5678');
   * console.log(history);
   */
  async createHistory(
    userId: string | Types.ObjectId,
    method: MethodPay,
    amount: number,
    amountOld: number,
    description: string,  
    type?: TypeHistory,
  ): Promise<History> {
    const newHistory = new this.historyModel({
      user: userId,
      method,
      amount,
      amountOld,
      description,
      type
    });

    return await newHistory.save();
  }

  /**
   * Retrieve all history records from the database.
   *
   * @returns {Promise<History[]>} - A promise that resolves to an array of History documents.
   *
   * @example
   * const histories = await this.historyService.getAll();
   * console.log(histories);
   */
  async getAll(): Promise<History[]> {
    return this.historyModel.find().exec();
  }

  async getByUser(userId: Types.ObjectId, type?: TypeHistory): Promise<History[]> {
    if(type){
      return await this.historyModel.find({user: userId, type})
    }
    return await this.historyModel.find({ user: userId })
  }
}
