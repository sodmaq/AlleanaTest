import { Controller, Get, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get('balance')
  async getBalance(@CurrentUser() user: any) {
    const wallet = await this.walletService.getWalletByUserId(user.userId);
    return {
      balance: wallet.balance,
      currency: wallet.currency,
      lastTransactionAt: wallet.lastTransactionAt,
    };
  }

  @Get('transactions')
  async getTransactions(@CurrentUser() user: any) {
    const transactions = await this.walletService.getTransactionHistory(
      user.userId,
    );
    return { transactions };
  }
}
