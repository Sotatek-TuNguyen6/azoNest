import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
export type PlatformDocument = HydratedDocument<Platform>;

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
