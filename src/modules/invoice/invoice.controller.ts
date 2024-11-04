import { Body, Controller, Get, HttpException, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { StatusEnum } from 'src/types/enum';
import { CustomRequest } from 'src/common/interfaces/custom-request.interface';
import { CommonResponse } from 'src/common/dtos/common-response.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CreateInvoiceFpaymentDto } from './dto/create-invoice-fpayment';

@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) { }

  @UseGuards(JwtAuthGuard)
  @Get("/history")
  async getHistory(@Req() req: CustomRequest) {
    try {
      const user = req.user
      const result = await this.invoiceService.getByUser(user.userId)

      return new CommonResponse(
        StatusEnum.SUCCESS,
        "Get successfull",
        result
      )
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
  @Post("/fpayment")
  async createFpayment(@Req() req: CustomRequest, @Body() data: CreateInvoiceFpaymentDto) {
    try {
      const user = req.user;
      const result = await this.invoiceService.createFpayment(data, user.userId)

      return new CommonResponse(
        StatusEnum.SUCCESS,
        "Created success",
        result
      )
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
