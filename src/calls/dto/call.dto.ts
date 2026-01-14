/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { CallType } from '../schemas/call-session.schema';

export class InitiateCallDto {
  @IsString()
  receiverId: string;

  @IsEnum(CallType)
  callType: CallType;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateCallStatusDto {
  @IsString()
  sessionId: string;

  @IsEnum(['ringing', 'connected', 'ended', 'failed'])
  status: string;

  @IsOptional()
  endReason?: string;
}

export class SendSignalDto {
  @IsString()
  sessionId: string;

  @IsString()
  signalType: string;

  @IsOptional()
  signalData?: any;
}
