import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';
import { User } from 'src/modules/users/interface/user.interface';

export interface UserPayLoad {
  username: string;
  sub: Types.ObjectId;
}
export interface LoginResponse {
  access_token: string;
}
@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(user: User):Promise<LoginResponse> {
    const payload: UserPayLoad = { username: user.email, sub: user._id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
