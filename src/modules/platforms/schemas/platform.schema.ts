import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
export type PlatformDocument = HydratedDocument<Platform>;

export interface ResponsePlatform {
  _id: Types.ObjectId;
  url: string;
  apikey: string;
  name: string;
  status: boolean;
}
@Schema({ timestamps: true })
export class Platform {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  apikey: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: true })
  status: boolean;
}

export const PlatformSchema = SchemaFactory.createForClass(Platform);
