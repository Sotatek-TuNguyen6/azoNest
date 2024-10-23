import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type HistoryLoginDocument = HistoryLogin & Document;

@Schema({ timestamps: true })
export class HistoryLogin {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  loginTime: Date;

  @Prop({ required: true })
  ipAddress: string;

  @Prop()
  deviceInfo: string;

  @Prop({ default: false })
  isSuccessful: boolean;
}

export const HistoryLoginSchema = SchemaFactory.createForClass(HistoryLogin);
