import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CounterDocument = HydratedDocument<Counter>;

@Schema()
export class Counter {
  @Prop({ required: true })
  id: string;  // Mỗi bộ đếm sẽ có một ID riêng, ví dụ: 'orderCode'

  @Prop({ required: true })
  seq: number;  
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
