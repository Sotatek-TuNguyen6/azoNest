import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { Types } from 'mongoose';
import { User } from 'src/modules/users/interface/user.interface';
import { Role } from 'src/types/enum';

export interface UserPayLoad {
  username: string;
  sub: Types.ObjectId;
  role: Role;
  tokenVersion: number;
}
export interface LoginResponse {
  access_token: string;
}
@Injectable()
export class AuthService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    private jwtService: JwtService,
  ) {}

  async login(user: User): Promise<LoginResponse> {
    const payload: UserPayLoad = {
      username: user.email,
      sub: user._id,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };
    const token = this.jwtService.sign(payload);

    await this.redisClient.set(
      `user-token-version-${user._id}`,
      user.tokenVersion,
      'EX',
      3600,
    );
    return {
      access_token: token,
    };
  }

  async logout(userId: string): Promise<void> {
    await this.redisClient.del(`user-token-version-${userId}`);
  }
}
