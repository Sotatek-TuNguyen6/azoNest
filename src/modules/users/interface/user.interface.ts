import { Types } from 'mongoose';

export interface User {
  _id: Types.ObjectId;
  email: string;
  age: number;
  address: string;
  password: string;
}
