import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ProductService } from './products.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { ImportProductDto } from './dto/import/import-product.dto';
import { CommonResponse } from 'src/common/dtos/common-response.dto';
import { StatusEnum } from 'src/types/enum';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post('/import')
  async importProduct(@Body() importProductDto: ImportProductDto) {
    try {
      const importedProducts = await this.productService.importData(importProductDto.origin);
      return new CommonResponse(
        StatusEnum.SUCCESS,
        'Products imported successfully',
        importedProducts,
      );
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to import products',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async getProduct() {
    try {
      const products = await this.productService.getService();
      return new CommonResponse(StatusEnum.SUCCESS, 'Fetched products successfully', products);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch products',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:id')
  async getProductById(@Param('id') id: string) {
    try {
      const product = await this.productService.getById(id);
      return new CommonResponse(StatusEnum.SUCCESS, 'Fetched product successfully', product);
    } catch (error) {
      if (error.message === 'Product not found') {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch product',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  async remove(@Param('id') id: string) {
    try {
      const deletedProduct = await this.productService.delete(id);
      return new CommonResponse(StatusEnum.SUCCESS, 'Product deleted successfully', deletedProduct);
    } catch (error) {
      if (error.message === 'Product not found') {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to delete product',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
