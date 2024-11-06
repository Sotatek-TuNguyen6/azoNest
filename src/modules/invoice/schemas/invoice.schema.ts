import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { StatusInvoice } from 'src/types/enum';
export type InvoiceDocument = HydratedDocument<Invoice>;

@Schema({ timestamps: true })
export class Invoice {
  @Prop()
  code: string;

  @Prop()
  type: string;

  @Prop({ default: StatusInvoice.processing })
  status: StatusInvoice;

  @Prop({ default: 0 })
  amount: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop()
  request_id: string;

  @Prop()
  description: string;

  @Prop()
  trans_id: string;

  @Prop({ type: Object })
  payment_details: Record<string, any>;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
