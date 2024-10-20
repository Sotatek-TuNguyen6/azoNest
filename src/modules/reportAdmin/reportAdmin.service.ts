import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../users/schemas/user.schema';
import { Model } from 'mongoose';
import { Products } from '../products/schemas/products.schema';
import { Orders } from '../orders/schemas/orders.schema';
import * as dayjs from 'dayjs';
export interface ResponseReport {
  userCount: number;
  serviceCount: number;
  orderCount: number;
  topOrders: PopulatedTopOrder[];
  totalRevenueByOrigin: TotalRevenueByOrigin[];
  totalYearRevenue: number;
  totalMonthRevenue: number;
  totalWeekRevenue: number;
  totalRevenueByMonth: TotalRevenueByMonth[];
}
interface TotalRevenueByOrigin {
  _id: string;
  totalRevenue: number;
}
interface TotalRevenueByMonth {
  _id: {
    month: number;
    year: number;
  };
  totalRevenue: number;
}
export interface PopulatedTopOrder {
  user: {
    name: string;
    email: string;
  };
  orderCount: number;
  totalSpent: number;
}
@Injectable()
export class ReportAdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Products.name) private productsModel: Model<Products>,
    @InjectModel(Orders.name) private ordersModel: Model<Orders>,
  ) {}

  /**
   * Get a summary report for admin dashboard
   * @returns {Promise<object>} - A report object containing totals for users, products, and orders
   */
  async getReport(): Promise<ResponseReport> {
    try {
      // Tổng số lượng người dùng
      const userCount = await this.userModel.countDocuments();

      // Tổng số lượng dịch vụ
      const serviceCount = await this.productsModel.countDocuments();

      // Tổng số lượng đơn hàng
      const orderCount = await this.ordersModel.countDocuments();

      // Top 5 người dùng có số lượng đơn hàng và tổng chi tiêu nhiều nhất
      const topOrders = await this.ordersModel.aggregate([
        {
          $group: {
            _id: '$user', // Group theo user ID
            orderCount: { $sum: 1 }, // Đếm số lượng đơn hàng
            totalSpent: { $sum: '$totalPrice' }, // Tổng số tiền đã chi tiêu
          },
        },
        {
          $sort: { orderCount: -1, totalSpent: -1 }, // Sắp xếp theo số lượng đơn hàng và tổng tiền chi tiêu giảm dần
        },
        {
          $limit: 5, // Lấy top 5 người dùng
        },
      ]);

      // Populate thông tin người dùng cho top 5
      const populatedTopOrders: PopulatedTopOrder[] = await Promise.all(
        topOrders.map(async (order) => {
          const user = await this.userModel
            .findById(order._id)
            .select('name email')
            .lean();
          return {
            user: user ? user : { name: 'Unknown', email: 'N/A' }, // Xử lý trường hợp user không tồn tại
            orderCount: order.orderCount,
            totalSpent: order.totalSpent,
          };
        }),
      );

      // Doanh thu theo năm, tháng, tuần
      const now = new Date();

      // Doanh thu trong năm
      const yearStart = dayjs().startOf('year').toDate();
      const totalYearRevenue = await this.ordersModel.aggregate([
        {
          $match: { createdAt: { $gte: yearStart, $lte: now } },
        },
        {
          $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } },
        },
      ]);

      // Doanh thu trong tháng
      const monthStart = dayjs().startOf('month').toDate();
      const totalMonthRevenue = await this.ordersModel.aggregate([
        {
          $match: { createdAt: { $gte: monthStart, $lte: now } },
        },
        {
          $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } },
        },
      ]);

      // Doanh thu trong tuần
      const weekStart = dayjs().startOf('week').toDate();
      const totalWeekRevenue = await this.ordersModel.aggregate([
        {
          $match: { createdAt: { $gte: weekStart, $lte: now } },
        },
        {
          $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } },
        },
      ]);

      // Doanh thu theo nguồn gốc
      const totalRevenueByOrigin: TotalRevenueByOrigin[] =
        await this.ordersModel.aggregate([
          {
            $group: {
              _id: '$origin',
              totalRevenue: { $sum: '$totalPrice' },
            },
          },
        ]);

      // Doanh thu theo từng tháng của năm hiện tại
      const totalRevenueByMonth: TotalRevenueByMonth[] =
        await this.ordersModel.aggregate([
          {
            $match: {
              createdAt: {
                $gte: dayjs().startOf('year').toDate(),
                $lte: dayjs().endOf('year').toDate(),
              },
            },
          },
          {
            $group: {
              _id: {
                month: { $month: '$createdAt' },
                year: { $year: '$createdAt' },
              },
              totalRevenue: { $sum: '$totalPrice' },
            },
          },
          {
            $sort: { '_id.month': 1 }, // Sắp xếp theo tháng
          },
        ]);

      // Trả về báo cáo
      return {
        userCount,
        serviceCount,
        orderCount,
        topOrders: populatedTopOrders, // Top 5 người dùng có nhiều đơn hàng nhất
        totalRevenueByOrigin,
        totalYearRevenue: totalYearRevenue[0]
          ? totalYearRevenue[0].totalRevenue
          : 0,
        totalMonthRevenue: totalMonthRevenue[0]
          ? totalMonthRevenue[0].totalRevenue
          : 0,
        totalWeekRevenue: totalWeekRevenue[0]
          ? totalWeekRevenue[0].totalRevenue
          : 0,
        totalRevenueByMonth, // Doanh thu theo tháng của năm hiện tại
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Server error, unable to generate report.',
      );
    }
  }
}
