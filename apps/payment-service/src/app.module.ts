import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { HealthController } from './health/health.controller';
import { PaymentModule } from './payment/payment.module';
import { PaymentOrder } from './payment/entities/payment-order.entity';
import { PaymentEvent } from './payment/entities/payment-event.entity';
import { LedgerEntry } from './payment/entities/ledger-entry.entity';
import { Wallet } from './payment/entities/wallet.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'payment_user',
      password: process.env.DB_PASSWORD || 'payment_pass',
      database: process.env.DB_NAME || 'payment_db',
      models: [PaymentOrder, PaymentEvent, LedgerEntry, Wallet],
      // For this learning project we auto-create tables on boot.
      // In production you'd run real migrations instead (see README).
      autoLoadModels: true,
      synchronize: true,
      logging: false,
    }),
    PaymentModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
