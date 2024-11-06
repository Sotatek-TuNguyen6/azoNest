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
import { StatusEnum } from 'src/types/enum';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CustomRequest } from 'src/common/interfaces/custom-request.interface';
import { PayPalWebhookDto } from './dto/paypal-callback.dto';

@Controller('deposit')
export class DepositController {
  constructor(private readonly depositService: DepositService) {}

  @Post()
  create(@Body() createDepositDto: CreateDepositDto) {
    return this.depositService.create(createDepositDto);
  }

  @Get()
  findAll() {
    return this.depositService.findAll();
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

      return new CommonResponse(StatusEnum.SUCCESS, 'Get successfull', result);
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

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDepositDto: UpdateDepositDto) {
    return this.depositService.update(+id, updateDepositDto);
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
          message: 'Add funds failed',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
