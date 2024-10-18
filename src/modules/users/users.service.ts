import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model, Types } from 'mongoose';
import { CommonResponse } from 'src/common/dtos/common-response.dto';
import { StatusEnum } from 'src/types/enum';
import { comparePassword, hashPassword } from 'src/utils/hashPassword.util';
import { LoginDto } from './dto/login/login-user.dto';
import { AuthService, LoginResponse } from 'src/guards/auth.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private authService: AuthService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password } = createUserDto;
    const findUser = await this.userModel.findOne({ email });
    if (findUser) {
      throw new Error('Email already exists'); 
    }

    const hashedPassword = await hashPassword(password);

    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });
    return createdUser.save(); // Trả về dữ liệu người dùng đã tạo
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec(); // Trả về danh sách người dùng
  }

  async findOne(id: string | Types.ObjectId): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new Error('User not found'); 
    }
    return user; // Trả về người dùng nếu tìm thấy
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updatedUser = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true });
    if (!updatedUser) {
      throw new Error('User not found'); 
    }
    return updatedUser; // Trả về người dùng đã cập nhật
  }

  async remove(id: string): Promise<User> {
    const deletedUser = await this.userModel.findByIdAndDelete(id);
    if (!deletedUser) {
      throw new Error('User not found'); 
    }
    return deletedUser; // Trả về người dùng đã xóa
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new Error('Email not exists'); 
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid password'); 
    }

    return this.authService.login(user); // Trả về token đăng nhập
  }
}


