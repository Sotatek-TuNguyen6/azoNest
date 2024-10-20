import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { Orders } from 'src/modules/orders/schemas/orders.schema';
import { User } from 'src/modules/users/schemas/user.schema';
import { MethodPay } from 'src/types/enum';
export type ReportDocument = HydratedDocument<Report>;

@Schema({ timestamps: true })
export class Report {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Order', required: true })
  order: Orders

  @Prop()
  description: string;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
