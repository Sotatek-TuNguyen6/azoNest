import { Body, Controller, Get, HttpException, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import { PaypalService } from "./paypal.service";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";
import { CustomRequest } from "src/common/interfaces/custom-request.interface";
import { CommonResponse } from "src/common/dtos/common-response.dto";
import { StatusEnum } from "src/types/enum";

@Controller('paypal')
export class PaypalController {
    constructor(private readonly paypalService: PaypalService) { }


    @UseGuards(JwtAuthGuard)
    @Post()
    async callBack(@Body("orderId") orderId: string, @Req() req: CustomRequest) {
        try {
            const user = req.user;
            const result = await this.paypalService.callBack(user.userId, orderId)

            return new CommonResponse(
                StatusEnum.SUCCESS,
                "Order successfull",
                // result
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
