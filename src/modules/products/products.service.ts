import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Action, OriginWeb, ResponeService } from 'src/types/enum';
import { Products, ProductsDocument } from './schemas/products.schema';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { URLSearchParams } from 'url';
import { CommonService } from 'src/common/service/common.service';
import { CustomLoggerService } from 'src/logger/custom-logger.service';
import { UpdateProductDto } from './dto/update/update-product.dto';
import { PlatformsService } from '../platforms/platforms.service';
import Redis from 'ioredis';

interface Data {
  key: string;
  action: Action;
}

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Products.name) private productsModel: Model<Products>,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    private readonly configService: ConfigService,
    private readonly commonService: CommonService,
    private readonly platformService: PlatformsService,
  ) { }
  private readonly logger = new Logger(ProductService.name)

  async importData(
    origin: OriginWeb,
    platform: Types.ObjectId,
  ): Promise<Products[]> {
    this.logger.log(`Starting import for origin: ${origin}`);

    let data: Data;
    switch (origin) {
      case OriginWeb.AZO:
        data = {
          key: this.configService.get<string>('AZO_KEY'),
          action: Action.services,
        };
        break;
      case OriginWeb.DG1:
        data = {
          key: this.configService.get<string>('DG1_KEY'),
          action: Action.services,
        };
        break;
      default:
        this.logger.warn('Unsupported origin');
        throw new Error('Unsupported origin');
    }

    const urlEncodedData = new URLSearchParams();
    urlEncodedData.append('key', data.key);
    urlEncodedData.append('action', data.action);

    const findPlatform = await this.platformService.getById(platform)

    if (!findPlatform) throw new BadRequestException("Platform not found");

    const url = findPlatform.url

    const response = await axios.post(url, urlEncodedData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (Array.isArray(response.data)) {
      const filteredData: ResponeService[] =
        origin === OriginWeb.DG1
          ? response.data.filter(
            (item: ResponeService) => item.platform === 'Youtube',
          )
          : response.data;

      const createdProducts = await Promise.all(
        filteredData.map(async (item) => {
          const createdProduct = new this.productsModel({
            value: item.service,
            label: item.name,
            origin,
            min: item.min,
            max: item.max,
            rate: item.rate,
            refill: item.refill,
            originPlatform: platform,
            platform: "Youtube",
            category: OriginWeb.DG1 === origin ? item.category : "Youtube | 4000H Watchtime"
          });

          // Lưu sản phẩm vào cơ sở dữ liệu
          await createdProduct.save();

          return createdProduct; // Trả về sản phẩm đã tạo
        }),
      );
      this.logger.log('Update success!!');
      return createdProducts; // Trả về danh sách sản phẩm đã tạo
    } else {
      throw new Error('Unexpected response format');
    }
  }

  // async getService(): Promise<Products[]> {
  // return this.productsModel.aggregate([
  //   {
  //     $group: {
  //       _id: "$category",
  //       products: { $push: "$$ROOT" } 
  //     }
  //   },
  //   {
  //     $sort: { _id: 1 } 
  //   }
  // ]).exec();
  // }

  async getService(): Promise<Products[]> {
    const redisKey = "groupedProducts";

    // Kiểm tra dữ liệu từ Redis
    const cachedData = await this.redisClient.get(redisKey);
    if (cachedData) {
      this.logger.debug("Data fetched from Redis");
      return JSON.parse(cachedData); // Trả về dữ liệu từ Redis
    }

    // Sử dụng aggregate để nhóm sản phẩm theo category
    const products = await this.productsModel.aggregate([
      {
        $group: {
          _id: "$category",
          products: { $push: "$$ROOT" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]).exec();


    // Lưu vào Redis với thời gian hết hạn 1 giờ (3600 giây)
    await this.redisClient.set(redisKey, JSON.stringify(products), 'EX', 3600);

    this.logger.debug("Data fetched from database using aggregate and saved to Redis");

    return products;
  }
  // async getService(): Promise<Record<string, Products[]>> {
  //   const redisKey = "groupedProducts";

  //   // Kiểm tra dữ liệu từ Redis
  //   const cachedData = await this.redisClient.get(redisKey);
  //   if (cachedData) {
  //     console.log("Data fetched from Redis");
  //     return JSON.parse(cachedData); // Trả về dữ liệu từ Redis
  //   }

  //   // Nếu không có trong Redis, truy vấn từ cơ sở dữ liệu
  //   const products = await this.productsModel.find().sort({ category: 1 }).exec();

  //   // Nhóm sản phẩm theo category
  //   const groupedProducts = products.reduce((acc, product) => {
  //     const category = product.category || "Unknown"; // Gán category là 'Unknown' nếu thiếu
  //     if (!acc[category]) {
  //       acc[category] = [];
  //     }
  //     acc[category].push(product);
  //     return acc;
  //   }, {} as Record<string, Products[]>);

  //   // Lưu vào Redis với thời gian hết hạn (tuỳ chọn thời gian hết hạn, ví dụ: 1 giờ)
  //   await this.redisClient.set(redisKey, JSON.stringify(groupedProducts), 'EX', 3600);

  //   console.log("Data fetched from database and saved to Redis");

  //   return groupedProducts;
  // }

  async getById(id: string): Promise<Products> {
    if (!id) {
      throw new Error('Id is empty');
    }

    const product = await this.productsModel.findById(id).exec();

    if (!product) {
      throw new Error('Product not found');
    }
    return product; // Trả về sản phẩm theo id
  }

  async delete(id: string): Promise<Products> {
    if (!id) {
      throw new Error('Id is empty');
    }

    const product = await this.productsModel.findByIdAndDelete(id).exec();

    if (!product) {
      throw new Error('Product not found');
    }

    return product; // Trả về sản phẩm đã bị xóa
  }

  /**
   * Update a specific product by its ID.
   *
   * @param {string} id - The ID of the product to update.
   * @param {UpdateProductDto} updateProductDto - The data transfer object containing the product update details.
   * @returns {Promise<Product>} - A promise that resolves to the updated Product document.
   *
   * @example
   * const updatedProduct = await this.productService.update('123456', updateProductDto);
   * console.log(updatedProduct);
   */
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Products> {
    // Tìm sản phẩm theo ID
    const existingProduct = await this.productsModel.findById(id).exec();

    // Nếu không tìm thấy sản phẩm, ném ra lỗi NotFoundException
    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Cập nhật sản phẩm với dữ liệu từ updateProductDto
    Object.assign(existingProduct, updateProductDto);

    // Lưu sản phẩm đã cập nhật
    return await existingProduct.save();
  }

  async getByValue(value: string): Promise<ProductsDocument> {
    if (!value) throw new Error('Valua is require');
    return await this.productsModel.findOne({ value });
  }

  async getByOrigin(origin: OriginWeb) {
    return this.productsModel.find({ origin });
  }

  async removeAll() {
    return this.productsModel.deleteMany({})
  }

  async getAll(): Promise<Products[]> {
    try {
      const redisKey = "products";
      const cachedData = await this.redisClient.get(redisKey);

      if (cachedData) {
        this.logger.debug("Data fetched from Redis");
        return JSON.parse(cachedData);
      }

      const products = await this.productsModel.find()

      await this.redisClient.set(redisKey, JSON.stringify(products), 'EX', 3600);

      return products;
    } catch (error) {
      this.logger.error("🚀 ~ ProductService ~ getAll ~ error:", error)
      throw error
    }
  }
}
