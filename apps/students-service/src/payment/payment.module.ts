import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { protoPath } from '../proto-path';
import { PaymentClientService } from './payment-client.service';
import { ApplicationPaymentService } from './application-payment.service';
import { ApplicationsStore } from './applications.store';
import { StudentsGrpcController } from './students.grpc.controller';
import { PaymentEventsConsumer } from './payment-events.consumer';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'PAYMENT_SERVICE',
        useFactory: () => ({
          transport: Transport.GRPC,
          options: {
            package: 'payment',
            protoPath: protoPath('payment.proto'),
            url: process.env.PAYMENT_SERVICE_URL || 'localhost:50061',
            loader: { keepCase: true },
          },
        }),
      },
    ]),
  ],
  controllers: [StudentsGrpcController, PaymentEventsConsumer],
  providers: [PaymentClientService, ApplicationPaymentService, ApplicationsStore],
})
export class PaymentModule {}
