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
  Patch,
  NotFoundException,
} from '@nestjs/common';
import { ProductService } from './products.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { ImportProductDto } from './dto/import/import-product.dto';
import { CommonResponse } from 'src/common/dtos/common-response.dto';
import { Role, StatusEnum } from 'src/types/enum';
import { UpdateProductDto } from './dto/update/update-product.dto';
import { Roles } from 'src/decorator/roles.decorator';
import { PlatformsService } from '../platforms/platforms.service';

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly platFormService: PlatformsService,
  ) {}

  // @UseGuards(JwtAuthGuard)
  // @Roles(Role.admin)
  @Post('/import')
  async importProduct(@Body() importProductDto: ImportProductDto) {
    try {
      const platform = await this.platFormService.getById(
        importProductDto.platform,
      );
      const importedProducts = await this.productService.importData(
        importProductDto.origin,
        platform._id,
        importProductDto.percent
      );
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

  // @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Get()
  async getProduct() {
    try {
      const products = await this.productService.getService();
      return new CommonResponse(
        StatusEnum.SUCCESS,
        'Fetched products successfully',
        products,
      );
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

  // @UseGuards(JwtAuthGuard)
  // @Roles(Role.admin)
  @Get('/getAll')
  async getAll() {
    try {
      const result = await this.productService.getAll();

      return new CommonResponse(StatusEnum.SUCCESS, 'Get successfull', result);
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

  @Get('/:id')
  async getProductById(@Param('id') id: string) {
    try {
      const product = await this.productService.getById(id);
      return new CommonResponse(
        StatusEnum.SUCCESS,
        'Fetched product successfully',
        product,
      );
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
  @Roles(Role.admin)
  @Delete('/:id')
  async remove(@Param('id') id: string) {
    try {
      const deletedProduct = await this.productService.delete(id);
      return new CommonResponse(
        StatusEnum.SUCCESS,
        'Product deleted successfully',
        deletedProduct,
      );
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

  // @UseGuards(JwtAuthGuard)
  // @Roles(Role.admin)
  @Patch('/:id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    try {
      const product = await this.productService.update(id, updateProductDto);

      return new CommonResponse(
        StatusEnum.SUCCESS,
        'Update product success!',
        product,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        // Nếu không tìm thấy sản phẩm, trả về lỗi 404
        throw new HttpException(
          {
            status: StatusEnum.ERROR,
            message: 'Failed to get user',
            error: error.message,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: 'Failed to get user',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/removeAll')
  async removeAll() {
    try {
      await this.productService.removeAll();

      return new CommonResponse(StatusEnum.SUCCESS, 'Remove successful!');
    } catch (error) {
      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: 'Failed to delete product',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
