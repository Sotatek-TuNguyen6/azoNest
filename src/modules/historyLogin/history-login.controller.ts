import { Controller, Post, Get, Param, Body, Delete, Ip, Headers, UseGuards, Req, HttpException, HttpStatus } from '@nestjs/common';
import { HistoryLoginService } from './history-login.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CustomRequest } from 'src/common/interfaces/custom-request.interface';
import { CommonResponse } from 'src/common/dtos/common-response.dto';
import { StatusEnum } from 'src/types/enum';

@Controller('loginHistory')
export class HistoryLoginController {
    constructor(private readonly historyLoginService: HistoryLoginService) { }

    // @Post()
    // async createLoginHistory(
    //     @Ip() ipAddress: string,
    //     @Headers("User-Agent") headers: string
    //     // @Body('userId') userId: string,
    //     // @Body('deviceInfo') deviceInfo: string,
    //     // @Body('browserInfo') browserInfo: string,
    //     // @Body('isSuccessful') isSuccessful: boolean,
    // ) {

    //     return "Ok"
    //     // return this.historyLoginService.createLoginHistory(userId, ipAddress, deviceInfo, browserInfo, isSuccessful);
    // }

    // @Get()
    // async getAll() {
    //     return this.historyLoginService.findAll();
    // }

    @UseGuards(JwtAuthGuard)
    @Get()
    async getLoginHistoryByUserId(@Req() req: CustomRequest,) {
        try {
            const user = req.user
            const result = await this.historyLoginService.findLoginHistoryByUserId(user.userId);
            return new CommonResponse(
                StatusEnum.SUCCESS,
                "Get succesfull!",
                result
            )
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

    @Delete('delete/:historyId')
    async deleteLoginHistory(@Param('historyId') historyId: string) {
        return this.historyLoginService.deleteLoginHistoryById(historyId);
    }
}
