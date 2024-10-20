import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from 'src/types/enum';
export type CatDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop()
  name: string;

  @Prop()
  age: number;

  @Prop()
  address: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  email: string;

  @Prop({ default: 0 })
  money: number;

  @Prop({ default: Role.user })
  role: Role;

  @Prop()
  apiKey: string;

  @Prop({ default: false })
  isBand: boolean;

  @Prop()
  phoneNumber: string;

  @Prop({ default: 0 })
  tokenVersion: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
