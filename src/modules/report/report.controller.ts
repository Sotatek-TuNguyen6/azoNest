import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { CommonResponse } from 'src/common/dtos/common-response.dto';
import { StatusEnum } from 'src/types/enum';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CustomRequest } from 'src/common/interfaces/custom-request.interface';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body('orderId') orderId: string,
    @Body('description') description: string,
    @Request() req: CustomRequest,
  ) {
    try {
      const userId = req.user.userId;
      const result = await this.reportService.create(
        userId,
        orderId,
        description,
      );

      return new CommonResponse(
        StatusEnum.SUCCESS,
        'Create report successfull',
        result,
      );
    } catch (error) {
      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: 'Create report fail',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async getALl() {
    try {
      const reports = await this.reportService.getAll();
      return new CommonResponse(StatusEnum.SUCCESS, 'Get successfull', reports);
    } catch (error) {
      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: 'Get report fail',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/:id')
  async getById(@Param('id') id: string) {
    try {
      const report = await this.reportService.getById(id);
      return new CommonResponse(
        StatusEnum.SUCCESS,
        'Get report succesfull',
        report,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(
          {
            status: StatusEnum.ERROR,
            message: 'Failed to get report',
            error: error.message,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: 'Get report fail',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
