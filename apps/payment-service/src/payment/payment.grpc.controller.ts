import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PaymentService } from './payment.service';

// Handles incoming gRPC calls defined in payment.proto.
// Field names are snake_case because we load the proto with keepCase: true.
@Controller()
export class PaymentGrpcController {
  private readonly logger = new Logger('PaymentGrpcController');

  constructor(private readonly paymentService: PaymentService) {}

  @GrpcMethod('PaymentService', 'CreatePayment')
  async createPayment(data: Record<string, string>) {
    this.logger.log(`CreatePayment domain=${data.domain} ref=${data.reference_id}`);
    const res = await this.paymentService.createPayment({
      checkoutId: data.checkout_id,
      paymentOrderId: data.payment_order_id,
      domain: data.domain,
      referenceId: data.reference_id,
      payerId: data.payer_id,
      amount: data.amount,
      currency: data.currency,
      buyerEmail: data.buyer_email,
      sellerAccount: data.seller_account,
      paymentCategory: data.payment_category,
      returnUrl: data.return_url,
      cancelUrl: data.cancel_url,
      idempotencyKey: data.idempotency_key,
      description: data.description,
      metadata: data.metadata,
    });

    return {
      status: res.status,
      message: res.message,
      payment_order_id: res.paymentOrderId,
      paypal_order_id: res.paypalOrderId,
      approve_url: res.approveUrl,
      payment_order_status: res.paymentOrderStatus,
    };
  }

  @GrpcMethod('PaymentService', 'CapturePayment')
  async capturePayment(data: Record<string, string>) {
    const res = await this.paymentService.capturePayment(
      data.payment_order_id || undefined,
      data.paypal_order_id || undefined,
    );
    return {
      status: res.status,
      message: res.message,
      payment_order_id: res.paymentOrderId,
      paypal_order_id: res.paypalOrderId,
      capture_id: res.captureId,
      payment_order_status: res.paymentOrderStatus,
    };
  }

  @GrpcMethod('PaymentService', 'GetPaymentStatus')
  async getPaymentStatus(data: Record<string, string>) {
    const order = await this.paymentService.getStatus(data.payment_order_id);
    return {
      status: 200,
      payment_order_id: order.paymentOrderId,
      payment_order_status: order.paymentOrderStatus,
      amount: order.amount,
      currency: order.currency,
    };
  }
}
