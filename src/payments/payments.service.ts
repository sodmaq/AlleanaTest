import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Payment,
  PaymentDocument,
  PaymentStatus,
} from './schemas/payment.schema';
import { WalletService } from '../wallet/wallet.service';
import { InitiatePaymentDto } from './dto/payment.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private walletService: WalletService,
  ) {}

  private generateReference(): string {
    return `PAY_${Date.now()}_${uuidv4().slice(0, 8).toUpperCase()}`;
  }

  async initiatePayment(
    userId: string,
    dto: InitiatePaymentDto,
  ): Promise<PaymentDocument> {
    const reference = this.generateReference();

    // Mock OnePipe API call
    const onePipeResponse = await this.mockOnePipeInitiate(dto);

    const payment = new this.paymentModel({
      userId,
      amount: dto.amount,
      currency: 'NGN',
      paymentMethod: dto.paymentMethod,
      status: PaymentStatus.PROCESSING,
      reference,
      onePipeReference: onePipeResponse.reference,
      provider: onePipeResponse.provider,
      metadata: {
        paymentMethod: dto.paymentMethod,
        initiatedAt: new Date(),
      },
    });

    return payment.save();
  }

  async verifyPayment(
    reference: string,
    userId: string,
  ): Promise<PaymentDocument> {
    const payment = await this.paymentModel.findOne({ reference, userId });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      return payment;
    }

    // Mock OnePipe verification
    const verificationResult = await this.mockOnePipeVerify(
      payment.onePipeReference,
    );

    if (verificationResult.status === 'success') {
      payment.status = PaymentStatus.COMPLETED;
      payment.completedAt = new Date();

      // Credit user wallet
      await this.walletService.creditWallet(
        userId,
        payment.amount,
        'Wallet Top-up',
        reference,
        {
          paymentMethod: payment.paymentMethod,
          provider: payment.provider,
        },
      );
    } else {
      payment.status = PaymentStatus.FAILED;
      payment.errorMessage = verificationResult.message;
    }

    return payment.save();
  }

  async getPaymentHistory(
    userId: string,
    limit = 20,
  ): Promise<PaymentDocument[]> {
    return this.paymentModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async getPaymentByReference(
    reference: string,
    userId: string,
  ): Promise<PaymentDocument> {
    const payment = await this.paymentModel.findOne({ reference, userId });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  // ========== MOCK OnePipe Integration ==========
  private async mockOnePipeInitiate(dto: InitiatePaymentDto): Promise<any> {
    // Simulate API delay
    await this.delay(500);

    // Mock OnePipe response
    return {
      status: 'success',
      reference: `ONEPIPE_${uuidv4().slice(0, 12).toUpperCase()}`,
      provider: this.getProviderName(dto.paymentMethod),
      authorizationUrl: 'https://mock-payment-gateway.com/authorize',
      message: 'Payment initiated successfully',
    };
  }

  private async mockOnePipeVerify(onePipeReference: string): Promise<any> {
    // Simulate API delay
    await this.delay(300);

    // Mock 90% success rate
    const isSuccessful = Math.random() > 0.1;

    if (isSuccessful) {
      return {
        status: 'success',
        reference: onePipeReference,
        message: 'Payment verified successfully',
      };
    } else {
      return {
        status: 'failed',
        reference: onePipeReference,
        message:
          'Payment verification failed - Insufficient funds or declined by bank',
      };
    }
  }

  private getProviderName(method: string): string {
    const providers = {
      card: 'Paystack',
      bank_transfer: 'Flutterwave',
      ussd: 'Interswitch',
    };
    return providers[method] || 'Generic Provider';
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
