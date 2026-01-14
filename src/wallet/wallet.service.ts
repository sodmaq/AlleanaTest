import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import {
  Transaction,
  TransactionDocument,
  TransactionType,
  TransactionStatus,
} from './schemas/transaction.schema';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {}

  async createWallet(userId: string): Promise<WalletDocument> {
    const wallet = new this.walletModel({
      userId,
      balance: 0,
      currency: 'NGN',
    });
    return wallet.save();
  }

  async getWalletByUserId(userId: string): Promise<WalletDocument> {
    const wallet = await this.walletModel.findOne({ userId });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return wallet;
  }

  async creditWallet(
    userId: string,
    amount: number,
    description: string,
    reference: string,
    metadata?: any,
  ): Promise<TransactionDocument> {
    const wallet = await this.getWalletByUserId(userId);

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + amount;

    const transaction = new this.transactionModel({
      walletId: wallet._id,
      type: TransactionType.CREDIT,
      amount,
      description,
      reference,
      metadata,
      balanceBefore,
      balanceAfter,
      status: TransactionStatus.COMPLETED,
    });

    wallet.balance = balanceAfter;
    wallet.lastTransactionAt = new Date();

    await wallet.save();
    return transaction.save();
  }

  async debitWallet(
    userId: string,
    amount: number,
    description: string,
    reference: string,
    metadata?: any,
  ): Promise<TransactionDocument> {
    const wallet = await this.getWalletByUserId(userId);

    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore - amount;

    const transaction = new this.transactionModel({
      walletId: wallet._id,
      type: TransactionType.DEBIT,
      amount,
      description,
      reference,
      metadata,
      balanceBefore,
      balanceAfter,
      status: TransactionStatus.COMPLETED,
    });

    wallet.balance = balanceAfter;
    wallet.lastTransactionAt = new Date();

    await wallet.save();
    return transaction.save();
  }

  async getTransactionHistory(
    userId: string,
    limit = 50,
  ): Promise<TransactionDocument[]> {
    const wallet = await this.getWalletByUserId(userId);

    return this.transactionModel
      .find({ walletId: wallet._id })
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}
