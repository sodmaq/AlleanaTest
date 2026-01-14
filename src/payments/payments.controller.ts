import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InitiatePaymentDto, VerifyPaymentDto } from './dto/payment.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('initiate')
  async initiatePayment(
    @CurrentUser() user: any,
    @Body() dto: InitiatePaymentDto,
  ) {
    const payment = await this.paymentsService.initiatePayment(
      user.userId,
      dto,
    );
    return {
      message: 'Payment initiated successfully',
      payment: {
        reference: payment.reference,
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
      },
    };
  }

  @Post('verify')
  async verifyPayment(@CurrentUser() user: any, @Body() dto: VerifyPaymentDto) {
    const payment = await this.paymentsService.verifyPayment(
      dto.reference,
      user.userId,
    );
    return {
      message:
        payment.status === 'completed'
          ? 'Payment verified successfully'
          : 'Payment verification failed',
      payment: {
        reference: payment.reference,
        amount: payment.amount,
        status: payment.status,
        completedAt: payment.completedAt,
        errorMessage: payment.errorMessage,
      },
    };
  }

  @Get('history')
  async getPaymentHistory(@CurrentUser() user: any) {
    const payments = await this.paymentsService.getPaymentHistory(user.userId);
    return { payments };
  }

  @Get(':reference')
  async getPayment(
    @CurrentUser() user: any,
    @Param('reference') reference: string,
  ) {
    const payment = await this.paymentsService.getPaymentByReference(
      reference,
      user.userId,
    );
    return { payment };
  }
}
