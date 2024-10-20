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

@SkipThrottle()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      const createdUser = await this.usersService.create(createUserDto);
      return new CommonResponse(
        StatusEnum.SUCCESS,
        'User created successfully',
        createdUser,
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
  async login(@Body() loginDto: LoginDto) {
    try {
      const accessToken = await this.usersService.login(loginDto);
      return new CommonResponse(
        StatusEnum.SUCCESS,
        'Login successful',
        accessToken,
      );
    } catch (error) {
      if (error.message === 'Email not exists') {
        throw new HttpException('Email not exists', HttpStatus.BAD_GATEWAY);
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

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.usersService.findOne(+id);
  // }

  @UseGuards(JwtAuthGuard)
  @Roles(Role.admin)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @SkipThrottle({ default: false })
  @Post('forgotPassword')
  async forgotPassword(@Body('email') email: string) {
    try {
      await this.usersService.forgotPassword(email)
      return new CommonResponse(
        StatusEnum.SUCCESS,
        'ForgotPassword successfull'
      )
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
  async resetPassword(@Body('token') token: string, @Body('newPassword') newPassword: string) {
    try {
      await this.usersService.resetPassword(token, newPassword)
      return new CommonResponse(
        StatusEnum.SUCCESS,
        'ResetPassword successfull'
      )
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

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.usersService.remove(+id);
  // }
}
