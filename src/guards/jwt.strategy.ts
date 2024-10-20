import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Types } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserPayLoad } from './auth.service';
import { Role } from 'src/types/enum';

export interface UserValidate {
  username: string;
  userId: Types.ObjectId;
  role: Role;
  tokenVersion: number;
}
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: UserPayLoad): Promise<UserValidate> {
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
      tokenVersion: payload.tokenVersion,
    };
  }
}
