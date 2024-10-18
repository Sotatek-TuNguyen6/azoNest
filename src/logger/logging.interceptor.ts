import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { tap } from 'rxjs/operators';
  import { CustomLoggerService } from './custom-logger.service'; // Adjust path to your logger
  import { Response } from 'express';
  
  @Injectable()
  export class LoggingInterceptor implements NestInterceptor {
    constructor(private readonly logger: CustomLoggerService) {}
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest();
      const response: Response = context.switchToHttp().getResponse();
      const ip = request.ip; // Extract the IP address
      const method = request.method;
      const url = request.url;
      const body = request.body;
      const params = request.params;
      const query = request.query;
  
      const message = `${method} ${url}`;
  
      // Log the incoming request with the IP address, body, params, and query
      this.logger.log(`Incoming request: ${message}`, {
        ip,
        body,
        params,
        query,
      });
  
      return next.handle().pipe(
        tap(() => {
          const statusCode = response.statusCode; // Get the HTTP status code
          // Log the completed request with status code, IP, body, params, and query
          this.logger.log(`Request to ${message} completed`, {
            ip,
            statusCode,
            body,
            params,
            query,
          });
        }),
      );
    }
  }
  