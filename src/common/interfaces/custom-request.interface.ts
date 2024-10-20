import { Request } from 'express';
import { UserValidate } from 'src/guards/jwt.strategy';

export interface CustomRequest extends Request {
  user?: UserValidate;
}
