import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { comparePassword, hashPassword } from 'src/utils/hashPassword.util';
import { LoginDto } from './dto/login/login-user.dto';
import { AuthService, LoginResponse } from 'src/guards/auth.service';
import { HistoryService } from '../history/history.service';
import { MethodPay, Role, TypeHistory } from 'src/types/enum';
import { MailService } from '../mail/mail.service';
import { HistoryLoginService } from '../historyLogin/history-login.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private authService: AuthService,
    private historyService: HistoryService,
    private mailService: MailService,
    private readonly historyLoginService: HistoryLoginService
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password } = createUserDto;
    const findUser = await this.userModel.findOne({ email });
    if (findUser) {
      throw new BadRequestException('Email already exists');
    }

    const apiKey = crypto.randomBytes(16).toString('hex');

    const hashedPassword = await hashPassword(password);

    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      apiKey,
    });
    return createdUser.save(); // Trả về dữ liệu người dùng đã tạo
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec(); // Trả về danh sách người dùng
  }

  async findOne(id: string | Types.ObjectId): Promise<User> {
    const user = await this.userModel.findById(id).select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async update(id: Types.ObjectId, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (updateUserDto.password) {
      const isMatch = await comparePassword(updateUserDto.password, user.password);
      if (isMatch) {
        throw new BadRequestException('New password cannot be the same as the old password');
      }
      updateUserDto.password = await hashPassword(updateUserDto.password)
    }

    user.tokenVersion += 1;

    Object.assign(user, updateUserDto);

    await user.save();

    return user;
  }

  async remove(id: string): Promise<User> {
    const deletedUser = await this.userModel.findByIdAndDelete(id);
    if (!deletedUser) {
      throw new Error('User not found');
    }
    return deletedUser; // Trả về người dùng đã xóa
  }

  async login(loginDto: LoginDto, ip: string, userAgent: string): Promise<LoginResponse> {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('Invalid password or email');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password or email');
    }

    await this.historyLoginService.createLoginHistory(user._id, ip, userAgent, true)

    return this.authService.login(user);
  }

  async loginByAdmin(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('Invalid password or email');
    }

    if(user.role !== Role.admin) throw new ForbiddenException("User not admin")

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password or email');
    }

    return this.authService.login(user);
  }

  async addMoneyByAdmin(
    usedId: string | Types.ObjectId,
    amount: number,
  ): Promise<User> {
    const user = await this.userModel.findById(usedId);

    if (!user) throw new Error('Userid not exists');

    const moneyOld = user.money
    user.money += amount;

    await user.save();

    await this.historyService.createHistory(
      usedId,
      MethodPay.HANDLE,
      amount,
      moneyOld,
      `DEPOSIT`,
      TypeHistory.addMoney
    );
    return user;
  }

  async checkApiKey(apiKey: string): Promise<any> {
    if (!apiKey) return new BadRequestException('Apikey not empty');

    const user = await this.userModel.findOne({ apiKey });

    if (!user) {
      throw new ForbiddenException('Invalid API key');
    }
    return user;
  }

  async forgotPassword(email: string) {
    try {
      const user: UserDocument = await this.userModel.findOne({ email });

      if (!user) {
        throw new NotFoundException('User with this email does not exist');
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(Date.now() + 3600000);
      await user.save();

      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await this.mailService.sendMail({
        to: email,
        subject: 'Reset Your Password',
        html: `<p>Please click the following link to reset your password:</p>
               <a href="${resetLink}">${resetLink}</a>`,
      });
      return true;
    } catch (error) {
      throw new Error("Error reset password")
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const user = await this.userModel.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        throw new BadRequestException('Invalid or expired token');
      }

      const hashedPassword = await hashPassword(newPassword)

      // Cập nhật mật khẩu mới và xóa token reset
      user.password = hashedPassword;
      user.resetPasswordToken = undefined; // Xóa token
      user.resetPasswordExpires = undefined; // Xóa thời gian hết hạn token

      await user.save(); // Lưu thay đổi

    } catch (error) {
      console.error('Error in resetPassword:', error.message || error);
      throw new InternalServerErrorException('Failed to reset password');
    }
  }

  async logout(id: Types.ObjectId) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.authService.logout(id);

  }

  async changeApiKey(id: Types.ObjectId) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new BadRequestException('User not found');
    }
    const apiKey = crypto.randomBytes(16).toString('hex');
    user.apiKey = apiKey;
    await user.save();

    return apiKey
  }
}
