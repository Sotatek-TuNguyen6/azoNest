import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PlatformsService } from './platforms.service';
import { CreateFlatFormDto } from './dto/create/create-platform.dto';
import { CommonResponse } from 'src/common/dtos/common-response.dto';
import { StatusEnum } from 'src/types/enum';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Types } from 'mongoose';

@Controller('platforms')
export class PlatformController {
  constructor(private readonly platformService: PlatformsService) {}

  // @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createPlatFormDto: CreateFlatFormDto) {
    try {
      const createdPlatform =
        await this.platformService.create(createPlatFormDto);
      return new CommonResponse(
        StatusEnum.SUCCESS,
        'Platform created successfully',
        createdPlatform,
      );
    } catch (error) {
      if (error.message === 'Platform already exists') {
        throw new HttpException(
          {
            status: StatusEnum.ERROR,
            message: 'Failed to created platform',
            error: error.message,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: 'Failed to created platform',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async getAll() {
    try {
      const result = await this.platformService.getAll();
      return new CommonResponse(
        StatusEnum.SUCCESS,
        'Get platform successfully',
        result,
      );
    } catch (error) {
      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: 'Get platform fail',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/:id')
  async getById(@Param('id') id: Types.ObjectId) {
    try {
      const platform = await this.platformService.getById(id);

      return new CommonResponse(
        StatusEnum.SUCCESS,
        'Get platform successfully',
        platform,
      );
    } catch (error) {
      if (error.message === `Platform with ID ${id} not found`) {
        throw new HttpException(
          {
            status: StatusEnum.ERROR,
            message: `Platform with ID ${id} not found`,
            error: error.message,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        {
          status: StatusEnum.ERROR,
          message: 'Get platform fail',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  async remove(@Param('id') id: string) {
    try {
      await this.platformService.delete(id);

      return new CommonResponse(StatusEnum.SUCCESS, 'Delete success');
    } catch (error) {
      if (
        error.message === 'id is require' ||
        error.message === `Platform with ID ${id} not found`
      ) {
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
          message: 'Delete platform fail',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('/:id')
  async update(
    @Param('id') id: string,
    @Body() updatePlatFormDto: CreateFlatFormDto,
  ) {
    try {
      // Attempt to update the platform using the service
      const updatedPlatform = await this.platformService.update(
        id,
        updatePlatFormDto,
      );
      return updatedPlatform;
    } catch (error) {
      // Handle specific error cases
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Platform with ID ${id} not found`);
      }
      // Handle any other unexpected errors
      throw new BadRequestException(
        `Failed to update platform: ${error.message}`,
      );
    }
  }
}
