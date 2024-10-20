import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { MethodPay } from 'src/types/enum';
export type HistoryDocument = HydratedDocument<History>;

@Schema({ timestamps: true })
export class History {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop()
  method: MethodPay;

  @Prop({ default: 0 })
  amount: number;

  @Prop()
  description: string;
}

export const HistorySchema = SchemaFactory.createForClass(History);
