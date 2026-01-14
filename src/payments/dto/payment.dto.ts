/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsNumber, IsEnum, IsString, Min, IsOptional } from 'class-validator';
import { PaymentMethod } from '../schemas/payment.schema';

export class InitiatePaymentDto {
  @IsNumber()
  @Min(100)
  amount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  @IsOptional()
  cardDetails?: string;

  @IsString()
  @IsOptional()
  bankCode?: string;
}

export class VerifyPaymentDto {
  @IsString()
  reference: string;
}
