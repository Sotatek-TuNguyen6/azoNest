import { User } from 'src/modules/users/interface/user.interface';

export interface OrderItem {
  quantity: number;
  link: string;
  service: string;
  order?: string;
  name?: string;
  keyword?: string;
}

export interface Orders {
  user: User;
  totalPrice: number;
  orderItems: OrderItem[];
  origin: string;
  orderStatus: string;
  charge: number;
  remains: number;
  start_count: number;
}
