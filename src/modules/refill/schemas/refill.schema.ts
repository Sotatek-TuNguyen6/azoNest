import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type RefillDocument = HydratedDocument<Refill>;

@Schema({ timestamps: true })
export class Refill {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Orders', required: true })
  orderId: Types.ObjectId;

  @Prop({ default: false })
  status: boolean;
}

export const RefillSchema = SchemaFactory.createForClass(Refill);
