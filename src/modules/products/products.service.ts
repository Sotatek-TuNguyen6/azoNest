import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommonResponse } from 'src/common/dtos/common-response.dto';
import { Action, OriginWeb, ResponeService, StatusEnum } from 'src/types/enum';
import { Products } from './schemas/products.schema';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { URLSearchParams } from 'url';
import { CommonService } from 'src/common/service/common.service';
import { CustomLoggerService } from 'src/logger/custom-logger.service';
// import * as queryString from 'query-string';

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

  async importData(origin: OriginWeb): Promise<Products[]> {
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

      const createdProducts = [];
      for (const item of filteredData) {
        const createdProduct = new this.productsModel({
          value: item.service,
          label: item.name,
          origin,
          min: item.min,
          max: item.max,
          rate: item.rate,
          refill: item.refill,
        });

        await createdProduct.save();
        createdProducts.push(createdProduct);
      }
      this.logger.log("Update success!!")
      return createdProducts; // Trả về danh sách sản phẩm đã tạo
    } else {
      throw new Error('Unexpected response format'); 
    }
  }

  async getService(): Promise<Products[]> {
    return this.productsModel.find().exec(); // Trả về danh sách sản phẩm
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
}
