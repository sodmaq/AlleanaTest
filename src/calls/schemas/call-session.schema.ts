import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CallSessionDocument = CallSession & Document;

export enum CallStatus {
  INITIATED = 'initiated',
  RINGING = 'ringing',
  CONNECTED = 'connected',
  ENDED = 'ended',
  FAILED = 'failed',
  MISSED = 'missed',
}

export enum CallType {
  VOICE = 'voice',
  VIDEO = 'video',
}

@Schema({ timestamps: true })
export class CallSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  callerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiverId: Types.ObjectId;

  @Prop({ required: true, enum: CallType })
  callType: CallType;

  @Prop({ required: true, enum: CallStatus, default: CallStatus.INITIATED })
  status: CallStatus;

  @Prop({ required: true, unique: true })
  sessionId: string;

  @Prop()
  startedAt: Date;

  @Prop()
  connectedAt: Date;

  @Prop()
  endedAt: Date;

  @Prop({ default: 0 })
  duration: number; // in seconds

  @Prop({ default: 0 })
  cost: number;

  @Prop({ default: 10 }) // 10 NGN per minute default
  ratePerMinute: number;

  @Prop()
  endReason: string;

  @Prop()
  metadata: any;

  @Prop()
  signalingData: any;
}

export const CallSessionSchema = SchemaFactory.createForClass(CallSession);
