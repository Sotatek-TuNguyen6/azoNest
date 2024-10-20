import { Types } from 'mongoose';
import { Role } from 'src/types/enum';

export interface User {
  _id: Types.ObjectId;
  email: string;
  age: number;
  address: string;
  password: string;
  role: Role;
  tokenVersion: number;
}
