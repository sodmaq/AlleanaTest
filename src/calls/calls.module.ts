import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CallsService } from './calls.service';
import { CallsController } from './calls.controller';
import { CallSession, CallSessionSchema } from './schemas/call-session.schema';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CallSession.name, schema: CallSessionSchema },
    ]),
    WalletModule,
  ],
  providers: [CallsService],
  controllers: [CallsController],
})
export class CallsModule {}
