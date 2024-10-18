import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CustomLoggerService } from '../logger/custom-logger.service'; // Adjust path to your custom logger

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly logger: CustomLoggerService) {
    super();
  }

  handleRequest(err, user, info, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip; // Get IP address
    const url = request.url; // Get the requested URL
    const method = request.method; // Get the HTTP method

    // If an error or user is not found, log the unauthorized access attempt
    if (err || !user) {
      const message = `Unauthorized access attempt - IP: ${ip}, Method: ${method}, URL: ${url}`;
      this.logger.error(message, err ? err.stack : 'No stack trace');
      throw err || new UnauthorizedException();
    }

    return user;
  }
}
