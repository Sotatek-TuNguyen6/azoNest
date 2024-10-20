import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { Products } from 'src/modules/products/schemas/products.schema';
import { User } from 'src/modules/users/schemas/user.schema';
export type OrdersDocument = HydratedDocument<Orders>;

@Schema({ timestamps: true })
export class OrderItem {
  @Prop({ type: Number, required: true })
  quantity: number;

  @Prop({ type: String, required: true })
  link: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true  })
  service: Products;

  @Prop({ type: String, required: true })
  order: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  keyword: string;
}

@Schema({ timestamps: true })
export class Orders {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ required: true, default: 0.0 })
  totalPrice: number;

  @Prop({ type: [{ type: MongooseSchema.Types.Mixed }], required: true })
  orderItems: OrderItem[];

  @Prop()
  origin: string;

  @Prop({ default: 'Pending' })
  orderStatus: string;

  @Prop({ default: 0 })
  charge: number;

  @Prop({ default: 0 })
  remains: number;

  @Prop({ default: 0 })
  start_count: number;
}

export const OrdersSchema = SchemaFactory.createForClass(Orders);
