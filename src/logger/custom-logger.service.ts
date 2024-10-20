import { LoggerService, Injectable } from '@nestjs/common';
import { createLogger, format, transports } from 'winston';
import * as path from 'path';

@Injectable()
export class CustomLoggerService implements LoggerService {
  private logger = createLogger({
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.printf(({ timestamp, level, message }) => {
        return `[${timestamp}] ${level}: ${message}`;
      }),
    ),
    transports: [
      new transports.File({
        filename: path.join(__dirname, '../../logs/error.log'),
        level: 'error',
      }),
      new transports.File({
        filename: path.join(__dirname, '../../logs/combined.log'),
      }),
    ],
  });

  log(message: string, meta?: any) {
    const logMessage = meta
      ? `${message} - IP: ${meta.ip} - Status: ${meta.statusCode} - Body: ${JSON.stringify(
          meta.body,
        )} - Params: ${JSON.stringify(meta.params)} - Query: ${JSON.stringify(
          meta.query,
        )}`
      : message;
    this.logger.info(logMessage);
  }

  error(message: string, trace: string, meta?: any) {
    const logMessage = meta
      ? `${message} - IP: ${meta.ip} - Status: ${meta.statusCode} - Body: ${JSON.stringify(
          meta.body,
        )} - Params: ${JSON.stringify(meta.params)} - Query: ${JSON.stringify(
          meta.query,
        )}`
      : message;
    this.logger.error(`${logMessage} - ${trace}`);
  }

  warn(message: string, meta?: any) {
    const logMessage = meta
      ? `${message} - IP: ${meta.ip} - Status: ${meta.statusCode} - Body: ${JSON.stringify(
          meta.body,
        )} - Params: ${JSON.stringify(meta.params)} - Query: ${JSON.stringify(
          meta.query,
        )}`
      : message;
    this.logger.warn(logMessage);
  }

  debug(message: string, meta?: any) {
    const logMessage = meta
      ? `${message} - IP: ${meta.ip} - Status: ${meta.statusCode} - Body: ${JSON.stringify(
          meta.body,
        )} - Params: ${JSON.stringify(meta.params)} - Query: ${JSON.stringify(
          meta.query,
        )}`
      : message;
    this.logger.debug(logMessage);
  }

  verbose(message: string, meta?: any) {
    const logMessage = meta
      ? `${message} - IP: ${meta.ip} - Status: ${meta.statusCode} - Body: ${JSON.stringify(
          meta.body,
        )} - Params: ${JSON.stringify(meta.params)} - Query: ${JSON.stringify(
          meta.query,
        )}`
      : message;
    this.logger.verbose(logMessage);
  }
}
