import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpException,
  HttpStatus,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { DepositService } from './deposit.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { UpdateDepositDto } from './dto/update-deposit.dto';
import { CommonResponse } from 'src/common/dtos/common-response.dto';
import { Role, StatusEnum } from 'src/types/enum';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CustomRequest } from 'src/common/interfaces/custom-request.interface';
import { PayPalWebhookDto } from './dto/paypal-callback.dto';
import { Roles } from 'src/decorator/roles.decorator';
import { Types } from 'mongoose';

@Controller('deposit')
export class DepositController {
  constructor(private readonly depositService: DepositService) { }

  @Post()
  create(@Body() createDepositDto: CreateDepositDto) {
    return this.depositService.create(createDepositDto);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(Role.admin)
  @Get()
  async findAll() {
    try {
      const result = await this.depositService.findAll();

      return new CommonResponse(StatusEnum.SUCCESS, 'Get successful', result);
    } catch (error) {
      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: error.message,
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.depositService.findOne(+id);
  // }

  @UseGuards(JwtAuthGuard)
  @Get('/:name')
  async findOne(@Param('name') name: string, @Req() req: CustomRequest) {
    try {
      const user = req.user;
      const result = await this.depositService.findOne(name, user.userId);

      return new CommonResponse(StatusEnum.SUCCESS, 'Get successful', result);
    } catch (error) {
      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: 'Get failed',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Roles(Role.admin)
  @Patch(':id')
  async update(
    @Param('id') id: Types.ObjectId,
    @Body() updateDepositDto: UpdateDepositDto,
  ) {
    try {
      await this.depositService.update(id, updateDepositDto);

      return new CommonResponse(StatusEnum.SUCCESS, 'Update successful');
    } catch (error) {
      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: error.message,
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete()
  remove() {
    return this.depositService.deleteAll();
  }

  @Post('callbackPaypal')
  @HttpCode(HttpStatus.OK)
  async callBack(@Body() data: PayPalWebhookDto) {
    try {
      const result = await this.depositService.callbackPaypal(data);
      return new CommonResponse(
        StatusEnum.SUCCESS,
        'Add funds success',
        result,
      );
    } catch (error) {
      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: error.message,
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/callbackMoMo')
  @HttpCode(HttpStatus.OK)
  async callBackMoMo(@Body() data: any) {
    try {
      await this.depositService.callBackMoMo(data)
      return true;
    } catch (error) {
      console.log("🚀 ~ DepositController ~ callBackMomo ~ error:", error)
    }
  }
}
