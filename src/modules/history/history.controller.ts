import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { HistoryService } from './history.service';
import { CommonResponse } from 'src/common/dtos/common-response.dto';
import { StatusEnum } from 'src/types/enum';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll() {
    try {
      const historys = await this.historyService.getAll();
      return new CommonResponse(
        StatusEnum.SUCCESS,
        'Get list history success',
        historys,
      );
    } catch (error) {
      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: 'Failed to get history',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
