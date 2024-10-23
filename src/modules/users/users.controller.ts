import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  HttpException,
  Req,
  ForbiddenException,
  BadRequestException,
  Ip,
  Headers,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login/login-user.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CommonResponse } from 'src/common/dtos/common-response.dto';
import { Role, StatusEnum } from 'src/types/enum';
import { Roles } from 'src/decorator/roles.decorator';
import { SkipThrottle } from '@nestjs/throttler';
import { CustomRequest } from 'src/common/interfaces/custom-request.interface';
import { UserValidate } from 'src/guards/jwt.strategy';

@SkipThrottle()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      await this.usersService.create(createUserDto);
      return new CommonResponse(
        StatusEnum.SUCCESS,
        'User created successfully',
        // createdUser,
      );
    } catch (error) {
      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: 'Failed to created user',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Ip() ip: string, @Headers('User-Agent') userAgent: string) {
    try {
      const accessToken = await this.usersService.login(loginDto, ip, userAgent);
      return new CommonResponse(
        StatusEnum.SUCCESS,
        'Login successful',
        accessToken,
      );
    } catch (error) {
      if (error.message === 'Email not exists' || error.message === "Invalid password") {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }

      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: 'Failed to login user',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // @UseGuards(JwtAuthGuard)
  // @Roles(Role.admin)
  @Get()
  async findAll() {
    try {
      const users = await this.usersService.findAll();
      return new CommonResponse(
        StatusEnum.SUCCESS,
        'Get users successful',
        users,
      );
    } catch (error) {
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

  @UseGuards(JwtAuthGuard)
  @Roles(Role.admin)
  @Post('/addMoney')
  @HttpCode(HttpStatus.OK)
  async addMoneyByAdmin(
    @Body('id') id: string,
    @Body('amount') amount: number,
  ) {
    try {
      const user = await this.usersService.addMoneyByAdmin(id, amount);

      return new CommonResponse(
        StatusEnum.SUCCESS,
        'Add money to user success',
        user,
      );
    } catch (error) {
      if (error.message === 'Email not exists') {
        throw new HttpException('Email not exists', HttpStatus.BAD_GATEWAY);
      }

      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: 'Failed add money to user',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('/detail')
  findOne(@Req() req: CustomRequest,
  ) {
    const user: UserValidate = req.user;
    return this.usersService.findOne(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  async update(@Body() updateUserDto: UpdateUserDto, @Req() req: CustomRequest) {
    try {
      const user = req.user

      if (updateUserDto.role && user.role !== Role.admin) {
        throw new ForbiddenException('User is not admin');
      }

      await this.usersService.update(user.userId, updateUserDto)
      return new CommonResponse(
        StatusEnum.SUCCESS,
        'Update successs',
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new HttpException(
          {
            status: StatusEnum.ERROR,
            message: error.message,
            error: error.message,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: 'Failed add money to user',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

  }

  @SkipThrottle({ default: false })
  @Post('forgotPassword')
  async forgotPassword(@Body('email') email: string) {
    try {
      await this.usersService.forgotPassword(email);
      return new CommonResponse(
        StatusEnum.SUCCESS,
        'ForgotPassword successfull',
      );
    } catch (error) {
      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: 'Failed to forgotPassword user',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @SkipThrottle({ default: false })
  @Post('resetPassword')
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    try {
      await this.usersService.resetPassword(token, newPassword);
      return new CommonResponse(
        StatusEnum.SUCCESS,
        'ResetPassword successfull',
      );
    } catch (error) {
      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: 'Failed to resetPassword user',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("/logout")
  async logout(@Req() req: CustomRequest) {
    const user = req.user
    await this.usersService.logout(user.userId)
    return true
  }
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.usersService.remove(+id);
  // }
}
