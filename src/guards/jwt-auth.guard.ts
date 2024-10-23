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

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private reflector: Reflector,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {
    super();
  }

  // Override canActivate to handle async logic
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const canActivate = (await super.canActivate(context)) as boolean;

    if (!canActivate) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ip = request.ip;
    const url = request.url;

    // Perform Redis token version check
    try {
      const storedTokenVersion = await this.redisClient.get(
        `user-token-version-${user.userId}`,
      );

      if (
        !storedTokenVersion ||
        Number(storedTokenVersion) !== user.tokenVersion
      ) {
        this.logger.warn(
          `Invalid token - IP: ${ip}, URL: ${url}, UserID: ${user.userId}`,
        );
        throw new UnauthorizedException('Token is no longer valid');
      }
    } catch (error) {
      this.logger.warn('Error checking token version:', error);
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

    // Role-based access control
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
