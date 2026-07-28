import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ApplicationPaymentService } from './application-payment.service';

interface PaymentCompletedPayload {
  domain: string;
  referenceId: string;
  paymentOrderId: string;
  amount: string;
  currency: string;
  eventId: string;
}

// Listens for payment events on RabbitMQ. This decouples payment completion
// from domain updates: even if this service was down, events replay later.
@Controller()
export class PaymentEventsConsumer {
  private readonly logger = new Logger('PaymentEventsConsumer');

  constructor(private readonly service: ApplicationPaymentService) {}

  @EventPattern('payment.application.completed')
  handlePaymentCompleted(@Payload() data: PaymentCompletedPayload) {
    this.logger.log(
      `Received payment.application.completed for reference ${data.referenceId}`,
    );
    this.service.handlePaymentCompletedEvent(data.referenceId);
  }
}
