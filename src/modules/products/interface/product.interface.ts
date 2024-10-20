import { Types } from 'mongoose';

export interface Product {
  _id: Types.ObjectId;
  value: string;
  label: string;
  icon: string;
  class: string;
  status: string;
  origin: string;
  rate: number;
  min: number;
  max: number;
  refill: boolean;
  platform: Types.ObjectId;
}
