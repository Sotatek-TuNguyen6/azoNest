import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RefillService } from './refill.service';
import { CreateRefillDto } from './dto/create/create-refill.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CustomRequest } from 'src/common/interfaces/custom-request.interface';
import { CommonResponse } from 'src/common/dtos/common-response.dto';
import { StatusEnum } from 'src/types/enum';

@Controller('refill')
export class RefillController {
  constructor(private readonly refillService: RefillService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createRefill(
    @Body() createRefillDto: CreateRefillDto,
    @Req() req: CustomRequest,
  ) {
    try {
      const user = req.user;

      await this.refillService.createRefill(user.userId, createRefillDto);

      return new CommonResponse(StatusEnum.SUCCESS, 'Refill successfull');
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

  @UseGuards(JwtAuthGuard)
  @Get()
  async getRefillByUser(@Req() req: CustomRequest) {
    try {
      const user = req.user;
      const result = await this.refillService.getRefillByUser(user.userId);
      return new CommonResponse(StatusEnum.SUCCESS, 'Get successfull', result);
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
}
