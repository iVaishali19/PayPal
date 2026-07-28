import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PaymentOrder } from './entities/payment-order.entity';
import { PaymentEvent } from './entities/payment-event.entity';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { Wallet } from './entities/wallet.entity';
import { PayPalService } from './paypal/paypal.service';
import { PaymentService } from './payment.service';
import { PaymentGrpcController } from './payment.grpc.controller';
import { PaymentHttpController } from './payment.http.controller';
import { PaymentEventsPublisher } from './events/payment-events.publisher';

@Module({
  imports: [
    SequelizeModule.forFeature([PaymentOrder, PaymentEvent, LedgerEntry, Wallet]),
    ClientsModule.registerAsync([
      {
        name: 'PAYMENT_EVENTS_CLIENT',
        useFactory: () => ({
          transport: Transport.RMQ,
          options: {
            urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
            queue: 'payment_events',
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
  ],
  controllers: [PaymentGrpcController, PaymentHttpController],
  providers: [PayPalService, PaymentService, PaymentEventsPublisher],
})
export class PaymentModule {}
