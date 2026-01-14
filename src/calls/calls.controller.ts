import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { CallsService } from './calls.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  InitiateCallDto,
  UpdateCallStatusDto,
  SendSignalDto,
} from './dto/call.dto';

@Controller('calls')
@UseGuards(JwtAuthGuard)
export class CallsController {
  constructor(private callsService: CallsService) {}

  @Post('initiate')
  async initiateCall(@CurrentUser() user: any, @Body() dto: InitiateCallDto) {
    const callSession = await this.callsService.initiateCall(user.userId, dto);
    return {
      message: 'Call initiated successfully',
      callSession: {
        sessionId: callSession.sessionId,
        callType: callSession.callType,
        status: callSession.status,
        receiverId: callSession.receiverId,
      },
    };
  }

  @Post('update-status')
  async updateStatus(
    @CurrentUser() user: any,
    @Body() dto: UpdateCallStatusDto,
  ) {
    const callSession = await this.callsService.updateCallStatus(
      dto.sessionId,
      user.userId,
      dto,
    );
    return {
      message: 'Call status updated',
      callSession: {
        sessionId: callSession.sessionId,
        status: callSession.status,
        duration: callSession.duration,
        cost: callSession.cost,
      },
    };
  }

  @Post('signal')
  async sendSignal(@CurrentUser() user: any, @Body() dto: SendSignalDto) {
    await this.callsService.storeSignalingData(
      dto.sessionId,
      user.userId,
      dto.signalType,
      dto.signalData,
    );
    return { message: 'Signal stored successfully' };
  }

  @Get('active')
  async getActiveCall(@CurrentUser() user: any) {
    const activeCall = await this.callsService.getActiveCall(user.userId);
    return { activeCall };
  }

  @Get('history')
  async getCallHistory(@CurrentUser() user: any) {
    const calls = await this.callsService.getCallHistory(user.userId);
    return { calls };
  }

  @Get(':sessionId')
  async getCallSession(
    @CurrentUser() user: any,
    @Param('sessionId') sessionId: string,
  ) {
    const callSession = await this.callsService.getCallSession(
      sessionId,
      user.userId,
    );
    return { callSession };
  }
}
