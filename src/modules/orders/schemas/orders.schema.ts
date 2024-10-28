import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { CounterDocument } from './counter.schema';  // Import schema Counter

export type OrdersDocument = HydratedDocument<Orders>;

@Schema({ timestamps: true })
export class OrderItem {
  @Prop({ type: Number, required: true })
  quantity: number;

  @Prop({ type: String, required: true })
  link: string;

  @Prop()
  service: string;

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
  user: Types.ObjectId;

  @Prop({ required: true, default: 0.0 })
  totalPrice: number;

  @Prop({ required: true })
  orderItems: OrderItem;

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

  @Prop({ unique: true })  // Đảm bảo giá trị orderCode là duy nhất
  orderCode: number;
}

export const OrdersSchema = SchemaFactory.createForClass(Orders);

// Middleware để tự tăng orderCode
OrdersSchema.pre('save', async function (next) {
  const order = this as OrdersDocument;

  if (order.isNew) {
    const CounterModel = this.model('Counter');  // Model của schema Counter
    const counter = await CounterModel.findOneAndUpdate(
      { id: 'orderCode' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    ).lean().exec() as CounterDocument;

    order.orderCode = counter.seq;
  }

  next();
});
