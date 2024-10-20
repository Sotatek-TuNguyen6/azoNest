import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { CustomRequest } from 'src/common/interfaces/custom-request.interface';

@Injectable()
export class RoleMiddleware implements NestMiddleware {
  constructor(private readonly allowedRoles: string[]) {}

  use(req: CustomRequest, res: Response, next: NextFunction) {
    // Extract role from the request (for example, from a JWT token)
    const user = req.user; // Assuming `req.user` is populated by a previous middleware like JWT auth
    if (!user || !this.allowedRoles.includes(user.role)) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    next(); // Proceed to the next middleware/route handler if the role is allowed
  }
}
