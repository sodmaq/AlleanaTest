import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WalletDocument = Wallet & Document;

@Schema({ timestamps: true })
export class Wallet {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true, default: 0, min: 0 })
  balance: number;

  @Prop({ required: true, default: 'NGN' })
  currency: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastTransactionAt: Date;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
