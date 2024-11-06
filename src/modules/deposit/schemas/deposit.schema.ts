import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DepositDocument = HydratedDocument<Deposit>;

@Schema({ timestamps: true })
export class Deposit {
  @Prop()
  name: string;

  @Prop({ type: Object })
  value: Record<string, any>;

  @Prop()
  key: string;

  @Prop({ default: true })
  active: boolean;
}

export const DepositSchema = SchemaFactory.createForClass(Deposit);
