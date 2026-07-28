import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PaymentClientService } from './payment-client.service';
import { ApplicationsStore } from './applications.store';

// The business brain. It knows tuition rules, then delegates the actual
// money handling to the payment-service over gRPC.
@Injectable()
export class ApplicationPaymentService {
  private readonly logger = new Logger('ApplicationPaymentService');

  constructor(
    private readonly paymentClient: PaymentClientService,
    private readonly applications: ApplicationsStore,
  ) {}

  async initiateTuitionPayment(applicationId: number, domain: string) {
    const application = this.applications.findById(applicationId);
    if (!application) {
      throw new NotFoundException(`Application ${applicationId} not found`);
    }
    if (application.paymentStatus === 'PAID') {
      return { status: 409, message: 'Application already paid', approveUrl: '' };
    }

    // Build PayPal return URLs from the frontend origin the client sent.
    const returnUrl = `${domain}/payment/successful?applicationId=${application.id}`;
    const cancelUrl = `${domain}/payment/failure?applicationId=${application.id}`;

    const result = await this.paymentClient.createPayment({
      checkout_id: `checkout-app-${application.id}`,
      payment_order_id: uuidv4(),
      domain: 'application',
      reference_id: String(application.id),
      payer_id: application.studentId,
      amount: application.amount,
      currency: application.currency,
      buyer_email: `${application.studentId}@example.com`,
      seller_account: `university-${application.universityId}`,
      payment_category: 'tuition_deposit',
      return_url: returnUrl,
      cancel_url: cancelUrl,
      idempotency_key: `app-${application.id}-tuition-${uuidv4()}`,
      description: `Tuition deposit for ${application.applicationId}`,
    });

    return {
      status: Number(result.status) || 200,
      message: 'ok',
      approveUrl: result.approve_url,
      paypalOrderId: result.paypal_order_id,
      paymentOrderId: result.payment_order_id,
    };
  }

  async captureTuitionPayment(applicationId: number, paypalOrderId: string) {
    const application = this.applications.findById(applicationId);
    if (!application) {
      throw new NotFoundException(`Application ${applicationId} not found`);
    }

    const result = await this.paymentClient.capturePayment({ paypal_order_id: paypalOrderId });

    if (result.payment_order_status === 'SUCCESS') {
      this.applications.markPaid(String(applicationId));
    }

    return {
      status: Number(result.status) || 200,
      message: result.message,
      applicationStatus: this.applications.findById(applicationId)?.paymentStatus || 'UNPAID',
    };
  }

  // Called by the RabbitMQ consumer (async safety-net path).
  handlePaymentCompletedEvent(referenceId: string) {
    const app = this.applications.markPaid(referenceId);
    if (app) {
      this.logger.log(`Application ${referenceId} marked PAID via event`);
    }
  }

  getApplication(applicationId: number) {
    return this.applications.findById(applicationId);
  }
}
