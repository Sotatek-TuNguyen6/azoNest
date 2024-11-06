import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/types/enum';
import Redis from 'ioredis';
import { CustomRequest } from 'src/common/interfaces/custom-request.interface';
import { Model } from 'mongoose';
import { User } from 'src/modules/users/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private reflector: Reflector,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const canActivate = (await super.canActivate(context)) as boolean;

    if (!canActivate) {
      return false;
    }

    const request: CustomRequest = context.switchToHttp().getRequest();
    const user = request.user;
    const tokenVersionInUser = await this.userModel.findOne({
      _id: user.userId,
    });
    const ip = request.ip;
    const url = request.url;

    try {
      const storedTokenVersion = await this.redisClient.get(
        `user-token-version-${user.userId}`,
      );
      if (
        !storedTokenVersion ||
        Number(storedTokenVersion) !== tokenVersionInUser.tokenVersion
      ) {
        this.logger.warn(
          `Invalid token - IP: ${ip}, URL: ${url}, UserID: ${user.userId}`,
        );
        throw new UnauthorizedException('Token is no longer valid');
      }
    } catch (error) {
      this.logger.warn(`Error checking token version:${error}`);
      throw new UnauthorizedException('Token validation failed');
    }

    return true;
  }

  handleRequest(err, user, info, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const method = request.method;
    const url = request.url;

    if (err || !user) {
      const message = `Unauthorized access attempt - IP: ${ip}, Method: ${method}, URL: ${url}`;
      this.logger.error(message, err ? err.stack : 'No stack trace');
      throw err || new UnauthorizedException();
    }

    const requiredRoles = this.reflector.get<Role[]>(
      'roles',
      context.getHandler(),
    );
    if (requiredRoles && !requiredRoles.includes(user.role)) {
      const message = `Forbidden access - IP: ${ip}, Method: ${method}, URL: ${url}, Role: ${user.role}`;
      this.logger.error(message);
      throw new ForbiddenException(
        'Bạn không có quyền truy cập vào tài nguyên này',
      );
    }

    return user;
  }
}
