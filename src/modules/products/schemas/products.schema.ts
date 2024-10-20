import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
export type ProductsDocument = HydratedDocument<Products>;

@Schema({ timestamps: true })
export class Products {
  @Prop({ default: '' })
  value: string;

  @Prop({ required: true })
  label: string;

  @Prop()
  icon: string;

  @Prop()
  class: string;

  @Prop()
  status: string;

  @Prop({ default: 'ytapi' })
  origin: string;

  @Prop({ default: 0 })
  rate: number;

  @Prop({ default: 0 })
  min: number;

  @Prop({ default: 0 })
  max: number;

  @Prop({ default: false })
  refill: boolean;

  @Prop()
  description: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Platform',
    required: true,
  })
  platform: Types.ObjectId;
}

export const ProductsSchema = SchemaFactory.createForClass(Products);
