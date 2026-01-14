import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CallSession,
  CallSessionDocument,
  CallStatus,
} from './schemas/call-session.schema';
import { WalletService } from '../wallet/wallet.service';
import { InitiateCallDto, UpdateCallStatusDto } from './dto/call.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CallsService {
  constructor(
    @InjectModel(CallSession.name)
    private callSessionModel: Model<CallSessionDocument>,
    private walletService: WalletService,
  ) {}

  private generateSessionId(): string {
    return `CALL_${Date.now()}_${uuidv4().slice(0, 8).toUpperCase()}`;
  }

  async initiateCall(
    callerId: string,
    dto: InitiateCallDto,
  ): Promise<CallSessionDocument> {
    // Check if caller has sufficient balance (minimum 1 minute)
    const wallet = await this.walletService.getWalletByUserId(callerId);
    const minimumBalance = 10; // 10 NGN for 1 minute

    if (wallet.balance < minimumBalance) {
      throw new BadRequestException(
        'Insufficient wallet balance to initiate call',
      );
    }

    const sessionId = this.generateSessionId();

    const callSession = new this.callSessionModel({
      callerId,
      receiverId: dto.receiverId,
      callType: dto.callType,
      status: CallStatus.INITIATED,
      sessionId,
      startedAt: new Date(),
      metadata: dto.metadata,
      ratePerMinute: 10, // 10 NGN per minute
    });

    return callSession.save();
  }

  async updateCallStatus(
    sessionId: string,
    userId: string,
    dto: UpdateCallStatusDto,
  ): Promise<CallSessionDocument> {
    const callSession = await this.callSessionModel.findOne({ sessionId });

    if (!callSession) {
      throw new NotFoundException('Call session not found');
    }

    // Verify user is part of the call
    const isParticipant =
      callSession.callerId.toString() === userId ||
      callSession.receiverId.toString() === userId;

    if (!isParticipant) {
      throw new BadRequestException('Unauthorized to update this call');
    }

    switch (dto.status) {
      case 'ringing':
        callSession.status = CallStatus.RINGING;
        break;

      case 'connected':
        callSession.status = CallStatus.CONNECTED;
        callSession.connectedAt = new Date();
        break;

      case 'ended':
        await this.endCall(callSession, dto.endReason);
        break;

      case 'failed':
        callSession.status = CallStatus.FAILED;
        callSession.endedAt = new Date();
        callSession.endReason = dto.endReason || 'Call failed';
        break;
    }

    return callSession.save();
  }

  private async endCall(
    callSession: CallSessionDocument,
    endReason?: string,
  ): Promise<void> {
    callSession.status = CallStatus.ENDED;
    callSession.endedAt = new Date();
    callSession.endReason = endReason || 'Call ended normally';

    // Calculate duration and cost
    if (callSession.connectedAt) {
      const durationMs =
        callSession.endedAt.getTime() - callSession.connectedAt.getTime();
      const durationMinutes = Math.ceil(durationMs / 60000); // Round up to nearest minute
      callSession.duration = Math.floor(durationMs / 1000); // Store in seconds

      const cost = durationMinutes * callSession.ratePerMinute;
      callSession.cost = cost;

      // Debit caller's wallet
      try {
        await this.walletService.debitWallet(
          callSession.callerId.toString(),
          cost,
          `Call charges - ${callSession.sessionId}`,
          callSession.sessionId,
          {
            callType: callSession.callType,
            duration: callSession.duration,
            receiverId: callSession.receiverId,
          },
        );
      } catch (error) {
        // If debit fails, mark in metadata but don't fail the call end
        callSession.metadata = {
          ...callSession.metadata,
          paymentFailed: true,
          paymentError: error.message,
        };
      }
    } else {
      // Call never connected
      callSession.status = CallStatus.MISSED;
    }
  }

  async getCallSession(
    sessionId: string,
    userId: string,
  ): Promise<CallSessionDocument> {
    const callSession = await this.callSessionModel
      .findOne({ sessionId })
      .populate('callerId', 'fullName email')
      .populate('receiverId', 'fullName email');

    if (!callSession) {
      throw new NotFoundException('Call session not found');
    }

    // Verify user is part of the call
    const isParticipant =
      callSession.callerId._id.toString() === userId ||
      callSession.receiverId._id.toString() === userId;

    if (!isParticipant) {
      throw new BadRequestException('Unauthorized to view this call');
    }

    return callSession;
  }

  async getCallHistory(
    userId: string,
    limit = 50,
  ): Promise<CallSessionDocument[]> {
    return this.callSessionModel
      .find({
        $or: [{ callerId: userId }, { receiverId: userId }],
      })
      .populate('callerId', 'fullName email')
      .populate('receiverId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async getActiveCall(userId: string): Promise<CallSessionDocument | null> {
    return this.callSessionModel.findOne({
      $or: [{ callerId: userId }, { receiverId: userId }],
      status: {
        $in: [CallStatus.INITIATED, CallStatus.RINGING, CallStatus.CONNECTED],
      },
    });
  }

  async storeSignalingData(
    sessionId: string,
    userId: string,
    signalType: string,
    signalData: any,
  ): Promise<void> {
    const callSession = await this.callSessionModel.findOne({ sessionId });

    if (!callSession) {
      throw new NotFoundException('Call session not found');
    }

    if (!callSession.signalingData) {
      callSession.signalingData = {};
    }

    callSession.signalingData[signalType] = {
      userId,
      data: signalData,
      timestamp: new Date(),
    };

    await callSession.save();
  }
}
