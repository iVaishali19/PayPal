import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { v4 as uuidv4 } from 'uuid';

// HTTP surface for webhooks, admin and direct testing (no gRPC needed).
@Controller('payments')
export class PaymentHttpController {
  private readonly logger = new Logger('PaymentHttpController');

  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  create(@Body() body: Record<string, string>) {
    return this.paymentService.createPayment({
      checkoutId: body.checkoutId || `checkout-${uuidv4()}`,
      paymentOrderId: body.paymentOrderId || uuidv4(),
      domain: body.domain || 'application',
      referenceId: body.referenceId || '0',
      payerId: body.payerId || 'anonymous',
      amount: body.amount || '10.00',
      currency: body.currency || 'USD',
      buyerEmail: body.buyerEmail || '',
      sellerAccount: body.sellerAccount || 'default',
      paymentCategory: body.paymentCategory || 'test',
      returnUrl: body.returnUrl || 'http://localhost:3000/payment/successful',
      cancelUrl: body.cancelUrl || 'http://localhost:3000/payment/failure',
      idempotencyKey: body.idempotencyKey || uuidv4(),
      description: body.description,
    });
  }

  @Post('capture')
  capture(@Body() body: { paymentOrderId?: string; paypalOrderId?: string }) {
    return this.paymentService.capturePayment(body.paymentOrderId, body.paypalOrderId);
  }

  @Get(':paymentOrderId/status')
  async status(@Param('paymentOrderId') paymentOrderId: string) {
    const order = await this.paymentService.getStatus(paymentOrderId);
    return {
      paymentOrderId: order.paymentOrderId,
      paymentOrderStatus: order.paymentOrderStatus,
      amount: order.amount,
      currency: order.currency,
    };
  }

  // PayPal webhook receiver (deduplication left as an exercise / see README).
  @Post('webhooks/paypal')
  webhook(@Body() body: Record<string, unknown>) {
    this.logger.log(`Webhook received: ${body?.event_type ?? 'unknown'}`);
    return { received: true };
  }
}
