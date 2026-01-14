import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CallsModule } from './calls/calls.module';
import { PaymentsModule } from './payments/payments.module';
import { WalletModule } from './wallet/wallet.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule, UsersModule, WalletModule, PaymentsModule, CallsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
