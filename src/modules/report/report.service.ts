import { Injectable, NotFoundException } from '@nestjs/common';
import { Report } from './schemas/report.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class ReportService {
  constructor(@InjectModel(Report.name) private reportModel: Model<Report>) {}

  /**
   * Tạo báo cáo mới
   * @param userId - ID của người dùng liên quan đến báo cáo
   * @param orderId - ID của đơn hàng liên quan đến báo cáo
   * @param description - Mô tả tùy chọn của báo cáo
   * @returns Báo cáo đã tạo
   */
  async create(userId: Types.ObjectId, orderId: string, description?: string) {
    const newReport = new this.reportModel({
      userId,
      orderId,
      description: description || 'No description provided',
      createdAt: new Date(),
    });
    return await newReport.save();
  }

  /**
   * Lấy tất cả báo cáo
   * @returns Tất cả báo cáo
   */
  async getAll(): Promise<Report[]> {
    return await this.reportModel.find();
  }

  /**
   * Lấy báo cáo theo ID
   * @param id - ID của báo cáo cần tìm
   * @returns Báo cáo nếu tìm thấy, hoặc ném ngoại lệ nếu không tìm thấy
   */
  async getById(id: string): Promise<Report> {
    const report = await this.reportModel.findById(id).exec();

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return report;
  }
}
