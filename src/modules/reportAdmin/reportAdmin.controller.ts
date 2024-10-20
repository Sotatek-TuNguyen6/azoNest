import { Controller, Get, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ReportAdminService } from './reportAdmin.service';
import { CommonResponse } from 'src/common/dtos/common-response.dto';
import { Role, StatusEnum } from 'src/types/enum';
import { Roles } from 'src/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('reportAdmin')
export class ReportAdminController {
  constructor(private readonly reportAdminService: ReportAdminService) {}

  @UseGuards(JwtAuthGuard)
  @Roles(Role.admin)
  @Get()
  async getReport() {
    try {
      const result = await this.reportAdminService.getReport();

      return new CommonResponse(
        StatusEnum.SUCCESS,
        'Get report successfull',
        result,
      );
    } catch (error) {
      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: 'Failed to get report',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
