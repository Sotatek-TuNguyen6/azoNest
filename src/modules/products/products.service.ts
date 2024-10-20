import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Action, OriginWeb, ResponeService } from 'src/types/enum';
import { Products } from './schemas/products.schema';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { URLSearchParams } from 'url';
import { CommonService } from 'src/common/service/common.service';
import { CustomLoggerService } from 'src/logger/custom-logger.service';
import { UpdateProductDto } from './dto/update/update-product.dto';

interface Data {
  key: string;
  action: Action;
}

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Products.name) private productsModel: Model<Products>,
    private readonly configService: ConfigService,
    private readonly commonService: CommonService,
    private readonly logger: CustomLoggerService,
  ) {}

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

    const url = this.commonService.getUrlByOrigin(origin);

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
            platform,
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

  async getService(): Promise<Products[]> {
    return this.productsModel.find().sort({ createdAt: -1 }).exec(); 
  }

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

  async getByValue(value: string) {
    if (!value) throw new Error('Valua is require');
    return this.productsModel.findOne({ value });
  }

  async getByOrigin(origin: OriginWeb) {
    return this.productsModel.find({ origin });
  }
}
