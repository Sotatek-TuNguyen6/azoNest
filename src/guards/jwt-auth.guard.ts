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
  private readonly logger = new Logger();
  constructor(
    private reflector: Reflector, // Sử dụng Reflector để lấy thông tin role
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {
    super();
  }

  handleRequest(err, user, info, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip; // Lấy địa chỉ IP
    const url = request.url; // Lấy URL được yêu cầu
    const method = request.method; // Lấy phương thức HTTP

    // Nếu có lỗi hoặc không tìm thấy người dùng, ghi log và trả lỗi không được phép truy cập
    if (err || !user) {
      const message = `Unauthorized access attempt - IP: ${ip}, Method: ${method}, URL: ${url}`;
      this.logger.error(message, err ? err.stack : 'No stack trace');
      throw err || new UnauthorizedException();
    }

    // Kiểm tra token với Redis (nếu token đã bị thu hồi hoặc hết hạn sớm hơn)
    const checkTokenVersion = this.redisClient
      .get(`user-token-version-${user.userId}`)
      .then((storedTokenVersion) => {
        if (
          !storedTokenVersion ||
          Number(storedTokenVersion) !== user.tokenVersion
        ) {
          this.logger.warn(
            `Invalid token - IP: ${ip}, URL: ${url}, UserID: ${user.sub}`,
          );
          throw new UnauthorizedException('Token is no longer valid');
        }
      });

    // Kiểm tra role của người dùng
    const requiredRoles = this.reflector.get<Role[]>(
      'roles',
      context.getHandler(),
    );
    if (requiredRoles && !requiredRoles.includes(user.role)) {
      // const message = `Forbidden access - IP: ${ip}, Method: ${method}, URL: ${url}, Role: ${user.role}`;
      // this.logger.error(message);
      throw new ForbiddenException(
        'Bạn không có quyền truy cập vào tài nguyên này',
      );
    }

    checkTokenVersion.catch((error) => {
      this.logger.warn('Error checking token version:', error);
      throw new UnauthorizedException('Token is no longer valid');
    });

    return user;
  }
}
