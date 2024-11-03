import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type DepositDocument = HydratedDocument<Deposit>;

@Schema({ timestamps: true })
export class Deposit {
    @Prop()
    name: string

    @Prop({ type: Object }) 
    value: Record<string, any>; 

    @Prop()
    key: string;
}

export const DepositSchema = SchemaFactory.createForClass(Deposit);
