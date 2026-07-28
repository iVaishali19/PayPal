import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';

export interface PaymentCompletedEvent {
  domain: string;
  referenceId: string;
  paymentOrderId: string;
  paypalOrderId: string;
  captureId: string;
  amount: string;
  currency: string;
}

// After a successful capture we broadcast an event. Interested domain
// services subscribe and update their own data independently.
@Injectable()
export class PaymentEventsPublisher {
  private readonly logger = new Logger('PaymentEventsPublisher');

  constructor(
    @Inject('PAYMENT_EVENTS_CLIENT') private readonly client: ClientProxy,
  ) {}

  publishCompleted(event: PaymentCompletedEvent) {
    const pattern = `payment.${event.domain}.completed`;
    this.logger.log(`Publishing event "${pattern}" for ${event.paymentOrderId}`);
    this.client.emit(pattern, { ...event, eventId: uuidv4() });
  }
}
